import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Bloques from "./pages/Bloques";
import Practica from "./pages/Practica";
import Correccion from "./pages/Correccion";
import Estadisticas from "./pages/Estadisticas";
import Perfil from "./pages/Perfil";
import Profesor from "./pages/Profesor";
import Examen from "./pages/Examen";
import Historial from "./pages/Historial";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            
            {/* Protected routes - any authenticated user */}
            <Route
              path="/bloques"
              element={
                <ProtectedRoute allowDemo>
                  <Bloques />
                </ProtectedRoute>
              }
            />
            <Route
              path="/practica/:blockId"
              element={
                <ProtectedRoute allowDemo>
                  <Practica />
                </ProtectedRoute>
              }
            />
            <Route
              path="/correccion/:questionId"
              element={
                <ProtectedRoute allowDemo>
                  <Correccion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/estadisticas"
              element={
                <ProtectedRoute>
                  <Estadisticas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/examen"
              element={
                <ProtectedRoute>
                  <Examen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/historial"
              element={
                <ProtectedRoute>
                  <Historial />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />
            
            {/* Protected routes - profesor/admin only */}
            <Route
              path="/profesor"
              element={
                <ProtectedRoute allowedRoles={['profesor', 'admin']}>
                  <Profesor />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
