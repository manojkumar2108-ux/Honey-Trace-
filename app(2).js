async function loginUser(event) {

    event.preventDefault();

    const contact =
        document.getElementById("loginContact").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    if (!window.honeyTraceDB) {
        alert("Supabase is not connected. Please refresh the page.");
        return;
    }

    if (!contact) {
        alert("Please enter your email or phone number.");
        return;
    }

    const isPhone = isMobileNumber(contact);

    /* =====================================================
       PHONE LOGIN → OTP
    ===================================================== */

    if (isPhone) {

        const phone = normalizeIndianPhone(contact);

        pendingPhone = phone;
        pendingPhoneRole = currentRole;

        const { error } =
            await window.honeyTraceDB.auth.signInWithOtp({
                phone: phone,
                options: {
                    shouldCreateUser: false
                }
            });

        if (error) {
            console.error("Phone OTP login error:", error);
            alert("OTP could not be sent: " + error.message);
            return;
        }

        document.getElementById("phoneOTP").value = "";

        document.getElementById("otpMessage").textContent =
            "Enter the 6-digit OTP sent to " + phone;

        closeModal("loginModal");

        document.getElementById("otpModal").style.display = "flex";

        return;
    }

    /* =====================================================
       EMAIL LOGIN → PASSWORD
    ===================================================== */

    if (!password) {
        alert("Please enter your password.");
        return;
    }

    const { data, error } =
        await window.honeyTraceDB.auth.signInWithPassword({
            email: contact,
            password: password
        });

    if (error) {
        alert("Login failed: " + error.message);
        return;
    }

    const user = data.user;

    const { data: profile, error: profileError } =
        await window.honeyTraceDB
            .from("profiles")
            .select("full_name, role")
            .eq("user_id", user.id)
            .maybeSingle();

    if (profileError) {
        alert("Profile load failed: " + profileError.message);
        return;
    }

    let role = "Buyer";

    if (profile?.role === "seller") {
        role = "Seller";
    } else if (profile?.role === "beekeeper") {
        role = "Beekeeper";
    }

    const name =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email;

    closeModal("loginModal");

    showUserDashboard(role, name);
}
