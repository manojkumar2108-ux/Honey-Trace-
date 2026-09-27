/* =========================================================
   AUTH — REGISTER (Supports Email, Indian Phone & OTP)
   ========================================================= */

function getDetailedAuthErrorMessage(error) {
  if (!error) return "Registration failed. Please try again.";
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return "This email or phone number is already registered. Please login instead.";
  }
  if (msg.includes("database error") || msg.includes("saving new user")) {
    return "Database profile creation error. Please verify your role or try again.";
  }
  if (msg.includes("invalid phone")) {
    return "Please enter a valid 10-digit Indian mobile number (+91).";
  }
  return error.message;
}

async function registerUser(event) {
  event.preventDefault();

  const nameElement = document.getElementById("registerName");
  const contactElement = document.getElementById("registerEmail");
  const passwordElement = document.getElementById("registerPassword");
  const confirmPasswordElement = document.getElementById("registerConfirmPassword");

  if (!nameElement || !contactElement || !passwordElement || !confirmPasswordElement) {
    showError("Registration form fields are missing.");
    return;
  }

  const name = nameElement.value.trim();
  const contact = contactElement.value.trim();
  const password = passwordElement.value;
  const confirmPassword = confirmPasswordElement.value;

  if (!name) return showError("Please enter your name.");
  if (!contact) return showError("Please enter an email or phone number.");
  if (password.length < 6) return showError("Password must contain at least 6 characters.");
  if (password !== confirmPassword) return showError("Passwords do not match.");

  const role = normalizeRole(currentRole); // returns 'buyer', 'seller', or 'beekeeper'
  const isPhone = !contact.includes("@") && /^\+?[0-9\s-]{10,14}$/.test(contact);

  try {
    let signUpPayload;

    if (isPhone) {
      const normalizedPhone = normalizeIndianPhone(contact);
      if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
        return showError("Please enter a valid 10-digit Indian mobile number.");
      }
      signUpPayload = {
        phone: normalizedPhone,
        password,
        options: { data: { full_name: name, role } }
      };
    } else {
      if (!contact.includes("@")) {
        return showError("Please enter a valid email address.");
      }
      signUpPayload = {
        email: contact,
        password,
        options: { data: { full_name: name, role } }
      };
    }

    const { data, error } = await db.auth.signUp(signUpPayload);

    if (error) {
      console.error("Registration error:", error);
      showError(getDetailedAuthErrorMessage(error));
      return;
    }

    if (!data?.user) {
      showError("Registration failed. User was not created.");
      return;
    }

    closeModal("registerModal");

    // Phone registration awaiting OTP
    if (isPhone && !data.session) {
      const otp = prompt("OTP sent to " + contact + ".\nEnter 6-digit OTP to complete registration:");
      if (otp) {
        const { data: otpData, error: otpErr } = await db.auth.verifyOtp({
          phone: normalizeIndianPhone(contact),
          token: otp.trim(),
          type: "sms"
        });
        if (otpErr) {
          console.error("OTP verification error:", otpErr);
          showError("OTP verification failed: " + otpErr.message);
          openLogin(currentRole);
          return;
        }
        if (otpData?.user) {
          await createUserProfileAfterLogin(otpData.user);
        }
        alert("Phone registration & verification successful!");
        await showUserDashboard(currentRole, contact);
      } else {
        alert("Registration initiated. Please verify your OTP at login.");
        openLogin(currentRole);
      }
      return;
    }

    // Email registration with email confirmation active
    if (!data.session) {
      alert("Registration successful!\n\nVerification email sent to:\n" + contact + "\n\nPlease confirm and then login.");
      openLogin(currentRole);
      return;
    }

    // Direct active session
    await createUserProfileAfterLogin(data.user);
    alert("Registration successful!");
    await showUserDashboard(currentRole, data.user.email || data.user.phone || contact);

  } catch (err) {
    console.error("Unexpected registration error:", err);
    showError("Something went wrong during registration.\n\n" + err.message);
  }
}

/* =========================================================
   CLIENT-SIDE PROFILE UPSERT FALLBACK
   ========================================================= */

async function createUserProfileAfterLogin(user) {
  try {
    const userId = user.id;
    const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || user.phone || "User";
    const role = user.user_metadata?.role || "buyer";

    // 1. Core Profile
    const { error: profileError } = await db
      .from("profiles")
      .upsert({ user_id: userId, full_name: fullName, role }, { onConflict: "user_id" });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return { success: false, message: "Profile creation error: " + profileError.message };
    }

    // 2. Beekeeper Profile
    if (role === "beekeeper") {
      const { error: beekeeperError } = await db
        .from("beekeeper_profiles")
        .upsert({ user_id: userId, beekeeper_name: fullName, phone: user.phone || "" }, { onConflict: "user_id" });
      if (beekeeperError) console.error("Beekeeper profile error:", beekeeperError);
    }

    // 3. Seller Profile
    if (role === "seller") {
      const { error: sellerError } = await db
        .from("seller_profiles")
        .upsert({ user_id: userId, seller_name: fullName, phone: user.phone || "" }, { onConflict: "user_id" });
      if (sellerError) console.error("Seller profile error:", sellerError);
    }

    return { success: true, message: "Profile created successfully." };
  } catch (err) {
    console.error("Profile creation exception:", err);
    return { success: false, message: err.message };
  }
}