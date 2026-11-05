const authConfig = {
  secret: process.env.AUTH_SECRET || "todo-speckit-dev-secret",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
};

export default authConfig;
