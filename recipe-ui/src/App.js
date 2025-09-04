/**
=========================================================
* Material Kit 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-kit-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import React, { useEffect } from "react";

// react-router components
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "services/contexts/authContext";
import { useLoading } from "services/contexts/loadingContext";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LinearProgress } from "@mui/material";

// Material Kit 2 React themes & routes
import theme from "assets/theme";
import routes from "routes";




export default function App() {
  const { count } = useLoading();
  const { pathname } = useLocation();
  const { token }    = useAuth();

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const isAuthed = Boolean(token);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {count > 0 && <LinearProgress color="secondary" />}
      <Routes>
        {routes.map(({ key, route, component, auth }) => {
          // if this route requires auth but we have no token, redirect home
          if (auth && !isAuthed) {
            return <Route key={key} path={route} element={<Navigate to="/" replace />} />;
          }
          // otherwise render the page component
          return <Route key={key} path={route} element={component} />;
        })}

        {/* Optional catch-all: redirect any unknown URL back home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
