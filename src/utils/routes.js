export const getHomePathByRole = (role) => {
    switch (role) {
        case "teacher":
            return "/dashboard";
        case "student":
            return "/student-articles";
        default:
            return "/";
    }
};
