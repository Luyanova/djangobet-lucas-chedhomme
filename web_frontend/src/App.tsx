import React from 'react';
import { Routes, Route, Link as RouterLink, useNavigate, Navigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Link as MuiLink } from '@mui/material';
import { useState, useEffect } from 'react';
import apiClient, { API_BASE_URL } from './config';
import { AxiosError } from 'axios';
import { List, ListItem, ListItemText, CircularProgress, Paper, Box } from '@mui/material';
import { TextField, Alert } from '@mui/material';
import AccountPage from './AccountPage';
import RacesPage from './RacesPage';
import BetsPage from './BetsPage';
import RulesPage from './RulesPage';

// Interface pour un lézard
interface Lizard {
  id: number;
  name: string;
  species: string;
  age: number;
  
}

// Interface pour l'utilisateur connecté (simple pour l'instant)
interface User {
  username: string;
  // email?: string; // We might add email later if decoded from token
}

function HomePage({ currentUser }: { currentUser: User | null }) {
  const [lizards, setLizards] = useState<Lizard[]>([]);
  const [loadingLizards, setLoadingLizards] = useState<boolean>(true);
  const [errorLizards, setErrorLizards] = useState<string | null>(null);
  const [displayedUser, setDisplayedUser] = useState<string | null>(null);

  useEffect(() => {
    const userFromStorage = localStorage.getItem('loggedInUser');
    if (userFromStorage) {
      setDisplayedUser(userFromStorage);
    } else {
      setDisplayedUser(null);
    }

    const fetchLizards = async () => {
      try {
        setLoadingLizards(true);
        setErrorLizards(null);
        const response = await apiClient.get('/lizards/');
        setLizards(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des lézards:", err);
        setErrorLizards("Impossible de charger les lézards. Veuillez vous connecter.");
      } finally {
        setLoadingLizards(false);
      }
    };
    fetchLizards();
  }, [currentUser]);

  return (
    <Container sx={{ marginTop: 4 }} className="text-center">
      {currentUser && (
        <Typography variant="h5" component="p" sx={{ mb: 2 }}>
          Bonjour, {currentUser.username} !
        </Typography>
      )}
      <Typography variant="h4" component="h1" gutterBottom className="text-blue-600">
        Bienvenue sur Djangobet!
      </Typography>
      <Typography variant="body1" paragraph>
        Votre plateforme de paris sur les courses de lézards. Préparez-vous pour l'action !
      </Typography>
      <Button variant="contained" color="primary" component={RouterLink} to="/races" sx={{ marginTop: 2, marginRight: 1 }}>
        Voir les Courses
      </Button>
      {!currentUser && (
         <Button variant="outlined" color="secondary" component={RouterLink} to="/login" sx={{ marginTop: 2, marginBottom: 4 }}>
           Se Connecter
         </Button>
      )}

      <Typography variant="h5" component="h2" gutterBottom sx={{ marginTop: 4 }}>
        Nos Lézards Stars
      </Typography>
      {loadingLizards && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {errorLizards && (
        <Typography color="error" sx={{ my: 2 }}>
          {errorLizards}
        </Typography>
      )}
      {!loadingLizards && !errorLizards && lizards.length === 0 && (
        <Typography sx={{ my: 2 }}>
          Aucun lézard n'est actuellement disponible. Revenez bientôt !
        </Typography>
      )}
      {!loadingLizards && !errorLizards && lizards.length > 0 && (
        <Paper elevation={3} sx={{ marginTop: 2 }}>
          <List>
            {lizards.map((lizard) => (
              <ListItem key={lizard.id} divider>
                <ListItemText
                  primary={<Typography variant="h6" className="text-green-700">{lizard.name}</Typography>}
                  secondary={`Espèce: ${lizard.species} - Âge: ${lizard.age} an(s)`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
}

function LoginPage({ setCurrentUser }: { setCurrentUser: (user: User | null) => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});
  const [detailError, setDetailError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setDetailError(null);
    setSuccessMessage('');

    try {
      const loginData = { username, password };
      const response = await apiClient.post('/token/', loginData);

      if (response.data && response.data.access && response.data.refresh) {
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        localStorage.setItem('loggedInUser', username);
        setCurrentUser({ username: username });
        setSuccessMessage('Connexion réussie !');
        setUsername('');
        setPassword('');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setDetailError("Réponse invalide du serveur lors de l'obtention des tokens.");
      }
    } catch (err) {
      console.error("Erreur lors de la connexion:", err);
      setErrors({});
      const axiosError = err as AxiosError<Record<string, string | string[]>>;
      if (axiosError.isAxiosError && axiosError.response && axiosError.response.data) {
        const apiErrors = axiosError.response.data;
        if (apiErrors.detail) {
          setDetailError(apiErrors.detail as string);
        } else {
          const formattedFieldErrors: Record<string, string> = {};
          let generalError = "Erreur de connexion inconnue.";
          let foundFieldErrors = false;
          for (const key in apiErrors) {
            if (Object.prototype.hasOwnProperty.call(apiErrors, key)) {
              const errorValue = apiErrors[key];
              if (key === 'non_field_errors' || key === 'detail') {
                generalError = Array.isArray(errorValue) ? errorValue.join(' ') : String(errorValue);
              } else {
                formattedFieldErrors[key] = Array.isArray(errorValue)
                  ? errorValue.join(' ')
                  : String(errorValue);
                foundFieldErrors = true;
              }
            }
          }
          if (foundFieldErrors) {
            setErrors(formattedFieldErrors);
            setDetailError("Veuillez corriger les erreurs ci-dessus.");
          } else {
            setDetailError(generalError);
          }
        }
      } else {
        setDetailError("Une erreur s'est produite. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ marginTop: 4, maxWidth: 'sm' }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom textAlign="center">
          Se connecter
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {detailError && (
            <Alert severity="error" sx={{ mb: 2 }}>{detailError}</Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username-login"
            label="Nom d'utilisateur"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={!!errors.username}
            helperText={errors.username}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password-login"
            label="Mot de passe"
            type="password"
            id="password-login"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Se connecter"}
          </Button>
          <Typography variant="body2" textAlign="center">
            Pas encore de compte ?{' '}
            <MuiLink component={RouterLink} to="/register" variant="body2">
              Inscrivez-vous
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const userData = {
        username,
        email,
        password,
      };
      await apiClient.post('/register/', userData);

      setSuccessMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      setUsername('');
      setEmail('');
      setPassword('');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      console.error("Erreur lors de l'inscription:", err);
      const axiosError = err as AxiosError<Record<string, string[]>>;
      if (axiosError.isAxiosError && axiosError.response && axiosError.response.data) {
        const apiErrors = axiosError.response.data;
        const formattedErrors: any = {};
        for (const key in apiErrors) {
          if (Object.prototype.hasOwnProperty.call(apiErrors, key)) {
            formattedErrors[key] = Array.isArray(apiErrors[key]) ? apiErrors[key].join(' ') : apiErrors[key];
          }
        }
        setErrors(formattedErrors);
      } else {
        setErrors({ general: "Une erreur s'est produite lors de l'inscription. Veuillez réessayer." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ marginTop: 4, maxWidth: 'sm' }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom textAlign="center">
          Créer un compte
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>{errors.general}</Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Nom d'utilisateur"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={!!errors.username}
            helperText={errors.username}
            disabled={loading}
          />
          <TextField
            margin="normal"
            fullWidth
            id="email"
            label="Adresse Email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mot de passe"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            disabled={loading}
          />
          {errors.non_field_errors && (
             <Alert severity="error" sx={{ mt:1, mb: 1 }}>{errors.non_field_errors}</Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "S'inscrire"}
          </Button>
          <Typography variant="body2" textAlign="center">
            Déjà un compte ?{' '}
            <MuiLink component={RouterLink} to="/login" variant="body2">
              Connectez-vous
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

function WebApplication() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser');
    const accessToken = localStorage.getItem('accessToken');
    if (user && accessToken) {
      setCurrentUser({ username: user });
    } else {
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
            Djangobet Web
          </Typography>
          {currentUser ? (
            <>
              <Button color="inherit" component={RouterLink} to="/races" sx={{ marginRight: 1 }}>
                Courses
              </Button>
              <Button color="inherit" component={RouterLink} to="/bets" sx={{ marginRight: 1 }}>
                Mes Paris
              </Button>
              <MuiLink component={RouterLink} to="/account" sx={{ color: 'inherit', marginRight: 2, textDecoration: 'underline' }}>
                <Typography variant="subtitle1">
                  Bonjour, {currentUser.username}
                </Typography>
              </MuiLink>
              <Button color="inherit" onClick={handleLogout}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Connexion
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Inscription
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<HomePage currentUser={currentUser} />} />
        <Route path="/login" element={<LoginPage setCurrentUser={setCurrentUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/races" element={<RacesPage />} />
        <Route path="/bets" element={currentUser ? <BetsPage /> : <Navigate to="/login" replace />} />
        <Route path="/account" element={currentUser ? <AccountPage currentUser={currentUser} /> : <Navigate to="/login" replace />} />
        <Route path="/rules" element={<RulesPage />} />
      </Routes>
    </>
  );
}

export default WebApplication;
