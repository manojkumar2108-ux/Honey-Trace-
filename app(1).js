async function verifyPhoneOTP(event) {

    event.preventDefault();

    const token =
        document.getElementById("phoneOTP").value.trim();

    if (!/^\d{6}$/.test(token)) {
        alert("Please enter the 6-digit OTP.");
        return;
    }

    if (!pendingPhone) {
        alert("Mobile verification session expired. Please login again.");
        closeModal("otpModal");
        openLogin(currentRole);
        return;
    }

    const { data, error } =
        await window.honeyTraceDB.auth.verifyOtp({
            phone: pendingPhone,
            token: token,
            type: "sms"
        });

    if (error) {
        console.error("OTP verification error:", error);
        alert("OTP verification failed: " + error.message);
        return;
    }

    const user = data.user;

    if (!user) {
        alert("Login failed. User session was not created.");
        return;
    }

    /* Load actual profile */
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
        user.phone;

    closeModal("otpModal");

    alert("Mobile OTP verified successfully!");

    showUserDashboard(role, name);

    pendingPhone = "";
    pendingPhoneRole = "Buyer";
}
