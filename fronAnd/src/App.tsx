import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import CheatsheetPage from "./pages/CheatsheetPage";
import CheatsheetListPage from "./pages/CheatsheetListPage";
import AssistantPage from "./pages/AssistantPage";
import DebianCommandsPage from "./pages/DebianCommandsPage";
import OllamaPage from "./pages/OllamaPage";
import ConfigGeneratorPage from "./pages/ConfigGeneratorPage";
import ConfigSnippetsPage from "./pages/ConfigSnippetsPage";

// Providers
import { ThemeProvider } from "./lib/theme-provider";
import { TranslationProvider } from "./lib/useTranslation";
import { AuthProvider } from "./lib/auth-provider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TranslationProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cheatsheets" element={<CheatsheetListPage />} />
                <Route path="/cheatsheets/:categoryId" element={<CheatsheetPage />} />
                <Route path="/debian-commands" element={<DebianCommandsPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/ollama" element={<OllamaPage />} />
                <Route path="/config-generator" element={<ConfigGeneratorPage />} />
                <Route path="/config-snippets" element={<ConfigSnippetsPage />} />
                <Route path="/config-snippets/:category" element={<ConfigSnippetsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </TranslationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
