// This JS file controls the profile of each individual user.
export const getUserProfile = async (req, res) => {
  res.json({
    name: "Peter Parker",
    preferences: { mode: "Explore", voice: "Peter" },
  });
};
