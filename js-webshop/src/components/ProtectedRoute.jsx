import {Navigate} from "react-router-dom";

export const ProtectedRoute = ({
                            logged_in,
                            redirectPath = '/login',
                            children,
                        }) => {
    if (!logged_in) {
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};
