import React, { useState, useEffect } from 'react';
import { Routes, Route, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Container, Box, Paper, BottomNavigation,
  BottomNavigationAction, CircularProgress, Card, CardContent,
  TextField, Alert as MuiAlert, Button, Divider, Chip, List, ListItem, ListItemText,
  Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, FormControl, InputLabel, Snackbar, InputAdornment
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CasinoIcon from '@mui/icons-material/Casino';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import StyleIcon from '@mui/icons-material/Style';
import apiClient from './config';
import { AxiosError } from 'axios';
import axios from 'axios';

interface User {
  username: string;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  funds?: number;
}

interface ApiErrorResponse {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: string | string[] | undefined;
}

interface Lizard {
  id: number;
  name: string;
  species: string;
  age: number;
}

interface Race {
  id: number;
  name: string;
  scheduled_at: string;
  status: 'upcoming' | 'ongoing' | 'finished' | 'cancelled';
  participants: Lizard[];
  winner: Lizard | null;
}

interface Bet {
  id: number;
  race_details: { id: number; name: string; };
  lizard_details: { id: number; name: string; };
  amount: string;
  placed_at: string;
}

function MobileHomePage({ currentUser }: { currentUser: User | null }) {
  const [lizards, setLizards] = useState<Lizard[]>([]);
  const [loadingLizards, setLoadingLizards] = useState<boolean>(true);
  const [errorLizards, setErrorLizards] = useState<string | null>(null);

  useEffect(() => {
    const fetchLizards = async () => {
      try {
        setLoadingLizards(true);
        setErrorLizards(null);
        const response = await apiClient.get('/lizards/');
        setLizards(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des lézards (mobile):", err);
        setErrorLizards("Impossible de charger les lézards. Veuillez vous connecter.");
      } finally {
        setLoadingLizards(false);
      }
    };
    fetchLizards();
  }, []);

  return (
    <Container sx={{ marginTop: 2, marginBottom: '72px' }}>
      {currentUser && (
        <Typography variant="h6" component="p" sx={{ mb: 1, textAlign: 'center' }}>
          Bonjour, {currentUser.username} !
        </Typography>
      )}
      <Typography variant="h5" component="h1" gutterBottom className="text-green-600 text-center">
        Djangobet Mobile
      </Typography>
      <Typography variant="body1" paragraph className="text-center">
        Pariez sur vos lézards préférés, où que vous soyez !
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom sx={{ marginTop: 3, textAlign: 'center' }}>
        Nos Lézards en Vedette
      </Typography>
      {loadingLizards && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>
      )}
      {errorLizards && <Typography color="error" sx={{ my: 2, textAlign: 'center' }}>{errorLizards}</Typography>}
      {!loadingLizards && !errorLizards && lizards.length === 0 && (
        <Typography sx={{ my: 2, textAlign: 'center' }}>Aucun lézard à afficher.</Typography>
      )}
      {!loadingLizards && !errorLizards && lizards.length > 0 && (
        <Box sx={{ marginTop: 1 }}>
          {lizards.map((lizard) => (
            <Card elevation={2} key={lizard.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" component="div" className="text-blue-700">{lizard.name}</Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">Espèce: {lizard.species}</Typography>
                <Typography variant="body2">Âge: {lizard.age} an(s)</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}

function MobileLoginPage({ setCurrentUser }: { setCurrentUser: (user: User | null) => void }) {
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
        setTimeout(() => navigate('/'), 1500);
      } else {
        setDetailError("Réponse invalide du serveur lors de l'obtention des tokens.");
      }
    } catch (err) {
      console.error("Erreur lors de la connexion (mobile):", err);
      setErrors({});
      const axiosError = err as AxiosError<Record<string, string | string[] | {detail?: string}>>;
      if (axiosError.isAxiosError && axiosError.response && axiosError.response.data) {
        const apiErrors = axiosError.response.data;
        if (typeof apiErrors === 'object' && apiErrors !== null && apiErrors.detail) {
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
                    } else if (key === 'username' || key === 'password') {
                        formattedFieldErrors[key] = Array.isArray(errorValue) ? errorValue.join(' ') : String(errorValue);
                        foundFieldErrors = true;
                    }
                }
            }

            if (foundFieldErrors) {
                setErrors(formattedFieldErrors);
                setDetailError("Veuillez corriger les erreurs indiquées.");
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
    <Container sx={{ marginTop: 2, marginBottom: '72px' }}>
      <Paper elevation={2} sx={{ padding: 2 }}>
        <Typography variant="h6" component="h1" gutterBottom textAlign="center">Se connecter</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {detailError && (
            <MuiAlert severity="error" sx={{ mb: 2 }}>{detailError}</MuiAlert>
          )}
          {successMessage && <MuiAlert severity="success" sx={{ mb: 2 }}>{successMessage}</MuiAlert>}
          <TextField 
            margin="normal" 
            required 
            fullWidth 
            id="username-login-mobile"
            label="Nom d'utilisateur" 
            name="username" 
            autoComplete="username" 
            autoFocus 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            error={!!errors.username} 
            helperText={errors.username} 
            disabled={loading} 
            variant="filled" 
          />
          <TextField 
            margin="normal" 
            required 
            fullWidth 
            name="password-login-mobile" 
            label="Mot de passe" 
            type="password" 
            id="password-login-mobile" 
            autoComplete="current-password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            error={!!errors.password} 
            helperText={errors.password} 
            disabled={loading} 
            variant="filled" 
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "Se connecter"}
          </Button>
          <Typography variant="body2" textAlign="center">
            Pas encore de compte ? <RouterLink to="/register" style={{ color: '#1976d2' }}>Inscrivez-vous</RouterLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

function MobileRacesPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for Bet Modal
  const [betModalOpen, setBetModalOpen] = useState<boolean>(false);
  const [selectedRaceForBet, setSelectedRaceForBet] = useState<Race | null>(null);
  const [selectedLizardId, setSelectedLizardId] = useState<string | number>('');
  const [betAmount, setBetAmount] = useState<string>('');
  const [betSubmitting, setBetSubmitting] = useState<boolean>(false);
  const [betFormFeedback, setBetFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchRaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<Race[]>('/races/');
        setRaces(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des courses (mobile):", err);
        if (err instanceof AxiosError && err.response?.status === 401) {
            setError("Veuillez vous connecter pour voir les courses.");
        } else {
            setError("Impossible de charger les courses. Réessayez plus tard.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRaces();
  }, []);

  const handleOpenBetModal = (race: Race) => {
    setSelectedRaceForBet(race);
    setSelectedLizardId('');
    setBetAmount('');
    setBetFormFeedback(null);
    setBetModalOpen(true);
  };

  const handleCloseBetModal = () => {
    setBetModalOpen(false);
    setSelectedRaceForBet(null);
  };

  const handleBetAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const valueForValidation = inputValue.replace(',', '.');
    if (/^\\d*\\.?\\d*$/.test(valueForValidation)) {
      setBetAmount(valueForValidation);
    }
  };

  const handleBetSubmit = async () => {
    if (!selectedRaceForBet || !selectedLizardId || !betAmount) {
      setBetFormFeedback({ type: 'error', message: 'Veuillez sélectionner un lézard et entrer un montant.' });
      return;
    }
    const amountNumber = parseFloat(betAmount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setBetFormFeedback({ type: 'error', message: 'Le montant du pari doit être un nombre positif.' });
      return;
    }

    setBetSubmitting(true);
    setBetFormFeedback(null);

    try {
      const betData = {
        race: selectedRaceForBet.id,
        lizard: selectedLizardId,
        amount: amountNumber.toFixed(2),
      };
      await apiClient.post('/bets/', betData);
      setBetFormFeedback({ type: 'success', message: 'Pari placé avec succès !' });
      setSnackbarOpen(true);
      handleCloseBetModal();
      // Optionally, refresh races or bets list here if needed
    } catch (err: unknown) {
      console.error("Erreur lors du placement du pari (mobile):", err);
      let errorMessage = "Impossible de placer le pari. Veuillez réessayer.";
      
      // Type guard for AxiosError
      const isAxiosError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
        return typeof error === 'object' && error !== null && 'isAxiosError' in error;
      };

      if (isAxiosError(err)) {
        if (err.response) { // Axios error with response
          if (err.response.status === 401) {
              errorMessage = "Session expirée ou non authentifié. Veuillez vous reconnecter.";
          } else if (err.response.data) {
              const apiErrors = err.response.data;
              if (typeof apiErrors.detail === 'string') {
                  errorMessage = apiErrors.detail;
              } else if (typeof apiErrors === 'object' && apiErrors !== null) {
                  const messages: string[] = [];
                  for (const key in apiErrors) {
                      if (Object.prototype.hasOwnProperty.call(apiErrors, key)) {
                          const errorValue = apiErrors[key];
                          messages.push(`${key}: ${Array.isArray(errorValue) ? errorValue.join(', ') : errorValue}`);
                      }
                  }
                  if (messages.length > 0) {
                      errorMessage = messages.join('; ');
                  } else {
                      errorMessage = "Erreur de validation du formulaire. Vérifiez les champs.";
                  }
              }  else if (typeof err.response.data === 'string') { 
                   errorMessage = err.response.data;
              }
          }
        } else if (err.request) { // Axios error without response (network issue)
          errorMessage = "Aucune réponse du serveur. Vérifiez votre connexion.";
        }
      } else if (err instanceof Error) { // Handle generic Error
        errorMessage = err.message || "Une erreur inconnue s'est produite.";
      } else {
        errorMessage = "Une erreur inconnue de type non-Error s'est produite.";
      }
      setBetFormFeedback({ type: 'error', message: errorMessage });
    } finally {
      setBetSubmitting(false);
    }
  };

  const getStatusChipColor = (status: Race['status']): "primary" | "secondary" | "success" | "error" | "default" => {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'ongoing': return 'secondary';
      case 'finished': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };
  
  const getStatusChipLabel = (status: Race['status']) => {
    switch (status) {
      case 'upcoming': return 'À venir';
      case 'ongoing': return 'En cours';
      case 'finished': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const upcomingRaces = races.filter(race => race.status === 'upcoming');
  const ongoingRaces = races.filter(race => race.status === 'ongoing');
  const finishedRaces = races.filter(race => race.status === 'finished');
  const cancelledRaces = races.filter(race => race.status === 'cancelled');

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 112px)', py: 2, marginBottom: '56px' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: 'center', marginTop: 4, marginBottom: '72px' }}>
        <MuiAlert severity="error">{error}</MuiAlert>
      </Container>
    );
  }

  const renderRaceSection = (title: string, raceList: Race[], sectionKey: string) => {
    if (raceList.length === 0) {
      return null;
    }
    return (
      <Box mb={3} key={sectionKey}>
        <Typography variant="h6" component="h2" gutterBottom sx={{ml:1}}>{title}</Typography>
        {raceList.map((race) => (
          <Card key={race.id} sx={{ mb: 2 }} elevation={2}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>{race.name}</Typography>
              <Chip 
                label={getStatusChipLabel(race.status)}
                color={getStatusChipColor(race.status)}
                size="small" 
                sx={{ mb: 1, mr: 1}}
              />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Prévue le: {new Date(race.scheduled_at).toLocaleString('fr-FR')}
              </Typography>
              <Typography variant="body2">
                Participants: {race.participants.map(p => p.name).join(', ') || 'Aucun participant'}
              </Typography>
              {race.status === 'finished' && race.winner && (
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', mt: 1 }}>
                  Gagnant: {race.winner.name}
                </Typography>
              )}
              {race.status === 'upcoming' && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="small"
                  onClick={() => handleOpenBetModal(race)}
                  sx={{ mt: 2 }}
                >
                  Parier
                </Button>
              )}
              {race.status === 'ongoing' && (
                 <Button 
                  variant="contained" 
                  color="secondary"
                  size="small"
                  sx={{ mt: 2 }}
                >
                  Voir les détails
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Container sx={{ marginTop: 2, marginBottom: '72px' }}>
      <Typography variant="h5" component="h1" gutterBottom textAlign="center">
        Courses de Lézards
      </Typography>
      {races.length === 0 && !loading && !error && (
         <Typography sx={{ textAlign: 'center', mt: 3 }}>Aucune course à afficher pour le moment.</Typography>
      )}
      {error && <MuiAlert severity="error" sx={{my: 2}}>{error}</MuiAlert>}
      
      {renderRaceSection("À venir", upcomingRaces, 'upcoming')}
      {renderRaceSection("En cours", ongoingRaces, 'ongoing')}
      {renderRaceSection("Terminées", finishedRaces, 'finished')}
      {renderRaceSection("Annulées", cancelledRaces, 'cancelled')}

      {selectedRaceForBet && (
        <Dialog open={betModalOpen} onClose={handleCloseBetModal} fullWidth maxWidth="xs">
          <DialogTitle>Parier sur {selectedRaceForBet.name}</DialogTitle>
          <DialogContent>
            {betFormFeedback && betFormFeedback.type === 'error' && (
              <MuiAlert severity="error" sx={{ mb: 2 }}>{betFormFeedback.message}</MuiAlert>
            )}
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="lizard-select-label-mobile">Choisir un Lézard</InputLabel>
              <Select
                labelId="lizard-select-label-mobile"
                id="lizard-select-mobile"
                value={selectedLizardId}
                label="Choisir un Lézard"
                onChange={(e) => setSelectedLizardId(e.target.value as string | number)}
              >
                <MenuItem value="">
                  <em>Sélectionner un Lézard</em>
                </MenuItem>
                {selectedRaceForBet.participants.map((lizard) => (
                  <MenuItem key={lizard.id} value={lizard.id}>
                    {lizard.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              autoFocus
              margin="dense"
              id="betAmount-mobile"
              label="Montant du Pari"
              type="text"
              fullWidth
              variant="outlined"
              value={betAmount}
              onChange={handleBetAmountInputChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
                inputMode: 'decimal',
              }}
              placeholder="0.00"
              required
            />
          </DialogContent>
          <DialogActions sx={{p: '16px 24px'}}>
            <Button onClick={handleCloseBetModal} color="secondary">Annuler</Button>
            <Button 
              onClick={handleBetSubmit} 
              variant="contained" 
              color="primary" 
              disabled={betSubmitting}
            >
              {betSubmitting ? <CircularProgress size={24} color="inherit" /> : "Soumettre le Pari"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {betFormFeedback?.type === 'success' && betFormFeedback.message ? (
          <MuiAlert onClose={() => setSnackbarOpen(false)} severity={"success"} sx={{ width: '100%' }}>
            {betFormFeedback.message}
          </MuiAlert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}

function MobileRegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});
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
      const userData = { username, email, password };
      await apiClient.post('/register/', userData);
      setSuccessMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      setUsername('');
      setEmail('');
      setPassword('');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de l'inscription (mobile):", err);
      const axiosError = err as AxiosError<Record<string, string[]>>;
      if (axiosError.isAxiosError && axiosError.response && axiosError.response.data) {
        const apiErrors = axiosError.response.data;
        const formattedErrors: Record<string, string> = {};
        for (const key in apiErrors) {
          if (Object.prototype.hasOwnProperty.call(apiErrors, key)) {
            formattedErrors[key] = Array.isArray(apiErrors[key]) 
                                     ? (apiErrors[key] as string[]).join(' ') 
                                     : String(apiErrors[key]);
          }
        }
        setErrors(formattedErrors);
      } else {
        setErrors({ general: "Une erreur s'est produite. Veuillez réessayer." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ marginTop: 2, marginBottom: '72px' }}>
      <Paper elevation={2} sx={{ padding: 2 }}>
        <Typography variant="h6" component="h1" gutterBottom textAlign="center">
          Créer un compte
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {errors.general && (
            <MuiAlert severity="error" sx={{ mb: 2 }}>{errors.general}</MuiAlert>
          )}
          {successMessage && (
            <MuiAlert severity="success" sx={{ mb: 2 }}>{successMessage}</MuiAlert>
          )}
          <TextField margin="normal" required fullWidth id="username" label="Nom d'utilisateur" name="username" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} error={!!errors.username} helperText={errors.username} disabled={loading} variant="filled" />
          <TextField margin="normal" fullWidth id="email" label="Adresse Email (optionnel)" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} helperText={errors.email} disabled={loading} variant="filled" />
          <TextField margin="normal" required fullWidth name="password" label="Mot de passe" type="password" id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={!!errors.password} helperText={errors.password} disabled={loading} variant="filled" />
          {errors.non_field_errors && (
             <MuiAlert severity="error" sx={{ mt:1, mb: 1 }}>{errors.non_field_errors}</MuiAlert>
          )}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "S'inscrire"}
          </Button>
          <Typography variant="body2" textAlign="center">
            Déjà un compte ? <RouterLink to="/login" style={{ color: '#1976d2' }}>Connectez-vous</RouterLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

function MobileAccountPage({ currentUser }: { currentUser: User | null }) {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Partial<UserProfile>>({
    email: '',
    first_name: '',
    last_name: '',
    funds: 0,
  });
  const [initialProfileLoading, setInitialProfileLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [profileErrorMessage, setProfileErrorMessage] = useState('');

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password1: '',
    new_password2: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');

  // State for Add Funds Modal
  const [addFundsModalOpen, setAddFundsModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [addFundsLoading, setAddFundsLoading] = useState(false);
  const [addFundsSnackbar, setAddFundsSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      setInitialProfileLoading(true);
      setProfileErrorMessage('');
      try {
        const response = await apiClient.get<UserProfile>('/profile/');
        setProfile({
          username: response.data.username,
          email: response.data.email,
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          funds: response.data.funds !== undefined ? Number(response.data.funds) : 0,
        });
      } catch (error: unknown) {
        console.error('Failed to fetch user profile (mobile):', error);
        if (axios.isAxiosError(error) && error.response?.data) {
            const errorData = error.response.data as ApiErrorResponse;
            setProfileErrorMessage(errorData?.detail || 'Failed to load profile. Please try again.');
        } else if (error instanceof Error) {
            setProfileErrorMessage(error.message || 'An unexpected error occurred while loading the profile.');
        } else {
            setProfileErrorMessage('An unexpected error occurred while loading the profile.');
        }
      } finally {
        setInitialProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser, navigate]);

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setProfileSuccessMessage('');
    setProfileErrorMessage('');
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordSuccessMessage('');
    setPasswordErrorMessage('');
  };

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileLoading(true);
    setProfileSuccessMessage('');
    setProfileErrorMessage('');

    if (!profile.email || !/\S+@\S+\.\S+/.test(profile.email)) {
        setProfileErrorMessage('Please enter a valid email address.');
        setProfileLoading(false);
        return;
    }

    try {
      const payload = {
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
      };
      await apiClient.put('/profile/', payload);
      setProfileSuccessMessage('Profile updated successfully!');
    } catch (e: unknown) { 
      console.error('Failed to update profile (mobile):', e);
      let messageToSet = 'Failed to update profile. Please try again.';
      if (e instanceof AxiosError && e.response?.data) {
        const apiErrors = e.response.data as ApiErrorResponse;
        const messages: string[] = [];
        if (apiErrors.email && Array.isArray(apiErrors.email)) messages.push(`Email: ${apiErrors.email.join(', ')}`);
        else if (typeof apiErrors.email === 'string') messages.push(`Email: ${apiErrors.email}`);

        if (apiErrors.first_name && Array.isArray(apiErrors.first_name)) messages.push(`First Name: ${apiErrors.first_name.join(', ')}`);
        else if (typeof apiErrors.first_name === 'string') messages.push(`First Name: ${apiErrors.first_name}`);
        
        if (apiErrors.last_name && Array.isArray(apiErrors.last_name)) messages.push(`Last Name: ${apiErrors.last_name.join(', ')}`);
        else if (typeof apiErrors.last_name === 'string') messages.push(`Last Name: ${apiErrors.last_name}`);

        if (apiErrors.detail) messages.push(apiErrors.detail);
        if (messages.length > 0) messageToSet = messages.join('; ');
      } else if (e instanceof Error) {
        messageToSet = e.message;
      }
      setProfileErrorMessage(messageToSet);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccessMessage('');
    setPasswordErrorMessage('');

    if (!passwordData.old_password || !passwordData.new_password1 || !passwordData.new_password2) {
        setPasswordErrorMessage('All password fields are required.');
        setPasswordLoading(false);
        return;
    }
    if (passwordData.new_password1 !== passwordData.new_password2) {
        setPasswordErrorMessage('New passwords do not match.');
        setPasswordLoading(false);
        return;
    }

    try {
      await apiClient.put('/profile/change-password/', passwordData);
      setPasswordSuccessMessage('Password updated successfully!');
      setPasswordData({ old_password: '', new_password1: '', new_password2: '' });
    } catch (e: unknown) { 
      console.error('Failed to update password (mobile):', e);
      let messageToSet = 'Failed to update password. Please try again.';
      if (e instanceof AxiosError && e.response?.data) {
        const apiErrors = e.response.data as ApiErrorResponse;
        const messages: string[] = [];
        if (apiErrors.old_password && Array.isArray(apiErrors.old_password)) messages.push(`Current Password: ${apiErrors.old_password.join(', ')}`);
        else if (typeof apiErrors.old_password === 'string') messages.push(`Current Password: ${apiErrors.old_password}`);

        if (apiErrors.new_password1 && Array.isArray(apiErrors.new_password1)) messages.push(`New Password: ${apiErrors.new_password1.join(', ')}`);
        else if (typeof apiErrors.new_password1 === 'string') messages.push(`New Password: ${apiErrors.new_password1}`);

        if (apiErrors.new_password2 && Array.isArray(apiErrors.new_password2)) messages.push(`Confirm Password: ${apiErrors.new_password2.join(', ')}`);
        else if (typeof apiErrors.new_password2 === 'string') messages.push(`Confirm Password: ${apiErrors.new_password2}`);
        
        if (apiErrors.detail) messages.push(apiErrors.detail);
        if (apiErrors.non_field_errors && Array.isArray(apiErrors.non_field_errors)) messages.push(apiErrors.non_field_errors.join(', '));
        else if (typeof apiErrors.non_field_errors === 'string') messages.push(apiErrors.non_field_errors);

        if (messages.length > 0) messageToSet = messages.join('; ');
      } else if (e instanceof Error) {
        messageToSet = e.message;
      }
      setPasswordErrorMessage(messageToSet);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Add Funds Modal Handlers
  const handleOpenAddFundsModal = () => {
    setFundAmount('');
    setAddFundsModalOpen(true);
  };

  const handleCloseAddFundsModal = () => {
    setAddFundsModalOpen(false);
  };

  const handleFundAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const valueForValidation = inputValue.replace(',', '.');
    if (/^\\d*\\.?\\d*$/.test(valueForValidation)) {
      setFundAmount(valueForValidation);
    }
  };

  const handleFundSubmit = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      setAddFundsSnackbar({ open: true, message: 'Veuillez entrer un montant valide.', severity: 'error' });
      return;
    }
    setAddFundsLoading(true);
    try {
      const response = await apiClient.post('/profile/add-funds/', { amount: parseFloat(fundAmount).toFixed(2) });
      setProfile(prev => ({ ...prev, funds: parseFloat(response.data.new_balance) }));
      setAddFundsSnackbar({ open: true, message: response.data.message || 'Fonds ajoutés avec succès !', severity: 'success' });
      setTimeout(() => {
        handleCloseAddFundsModal();
      }, 1500);
    } catch (err: unknown) {
      console.error('Failed to add funds (mobile):', err);
      let displayMessage = "Erreur lors de l'ajout des fonds. Veuillez réessayer.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          const respData = err.response.data as ApiErrorResponse;
          if (respData) {
            if (typeof respData === 'string') {
              displayMessage = respData;
            } else if (respData.amount && Array.isArray(respData.amount) && respData.amount.length > 0) {
              displayMessage = (respData.amount as string[]).join(', ');
            } else if (respData.detail && typeof respData.detail === 'string') {
              displayMessage = respData.detail;
            } else if (respData.message && typeof respData.message === 'string') {
              displayMessage = respData.message;
            } else if (typeof respData === 'object' && respData !== null) {
              const errorMessages = Object.values(respData).flat().join('; ');
              if (errorMessages) displayMessage = errorMessages;
            }
            
            if (displayMessage === "Erreur lors de l'ajout des fonds. Veuillez réessayer.") {
                 if (err.response.status === 400) {
                    displayMessage = 'Données invalides. Veuillez vérifier le montant et réessayer.';
                } else if (err.response.status === 500) {
                    displayMessage = 'Erreur du serveur. Veuillez réessayer plus tard.';
                }
            }
          }
        } else if (err.request) {
          displayMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
        } else {
          displayMessage = 'Erreur lors de la préparation de la requête.';
        }
      } else if (err instanceof Error) {
        displayMessage = err.message;
      }
      setAddFundsSnackbar({ open: true, message: displayMessage, severity: 'error' });
    } finally {
      setAddFundsLoading(false);
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setAddFundsSnackbar({ ...addFundsSnackbar, open: false });
  };

  if (!currentUser) {
    return <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}><CircularProgress /></Box>;
  }
  
  if (initialProfileLoading) {
    return (
        <Container sx={{ marginTop: 2, marginBottom: '72px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <CircularProgress />
            <Typography sx={{mt:2}}>Loading profile...</Typography>
        </Container>
    );
  }

  return (
    <Container sx={{ marginTop: 2, marginBottom: '72px' }}>
      <Typography variant="h5" component="h1" gutterBottom textAlign="center" sx={{ mb: 2}}>
        Mon Compte
      </Typography>
      {currentUser && (
        <Typography variant="subtitle1" component="p" sx={{ mb: 2, textAlign: 'center' }}>
          Bonjour, {profile.username || currentUser.username} !
        </Typography>
      )}

      {/* Display Funds */}
      <Paper elevation={3} sx={{ padding: 2, marginBottom: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h6" component="h2" gutterBottom textAlign="center">
          Mes Fonds Actuels
        </Typography>
        <Typography variant="h5" component="p" textAlign="center" sx={{ fontWeight: 'bold' }}>
          {initialProfileLoading ? <CircularProgress size={20} color="inherit"/> : `${(profile.funds ?? 0).toFixed(2)} €`}
        </Typography>
        <Box textAlign="center" sx={{mt: 1.5}}>
            <Button variant="contained" color="secondary" onClick={handleOpenAddFundsModal} size="small">
                Ajouter des Fonds
            </Button>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ padding: 2, mb: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Mettre à jour le profil
        </Typography>
        {profileSuccessMessage && <MuiAlert severity="success" sx={{ mb: 2 }}>{profileSuccessMessage}</MuiAlert>}
        {profileErrorMessage && <MuiAlert severity="error" sx={{ mb: 2 }}>{profileErrorMessage}</MuiAlert>}
        <Box component="form" onSubmit={handleUpdateProfile} noValidate sx={{ mt: 1 }}>
          <TextField margin="normal" required fullWidth id="email-mobile" label="Adresse e-mail" name="email" type="email" value={profile.email || ''} onChange={handleProfileInputChange} error={!!(profileErrorMessage && profileErrorMessage.toLowerCase().includes('email'))} disabled={profileLoading} variant="filled" />
          <TextField margin="normal" fullWidth id="first_name-mobile" label="Prénom" name="first_name" value={profile.first_name || ''} onChange={handleProfileInputChange} disabled={profileLoading} variant="filled" />
          <TextField margin="normal" fullWidth id="last_name-mobile" label="Nom de famille" name="last_name" value={profile.last_name || ''} onChange={handleProfileInputChange} disabled={profileLoading} variant="filled" />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={profileLoading}>
            {profileLoading ? <CircularProgress size={24} color="inherit" /> : "Sauvegarder Profil"}
          </Button>
        </Box>
      </Paper>
      
      <Divider sx={{ my: 2 }} />

      <Paper elevation={2} sx={{ padding: 2, mb: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Règles du Jeu
        </Typography>
        <Typography paragraph sx={{fontSize: '0.9rem'}}>
          Consultez les règles complètes de Djangobet.
        </Typography>
        <Button component={RouterLink} to="/rules" variant="outlined" color="info" size="small">
          Voir les Règles
        </Button>
      </Paper>

      <Divider sx={{ my: 2 }} />

      <Paper elevation={2} sx={{ padding: 2, mb: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Changer de mot de passe
        </Typography>
        {passwordSuccessMessage && <MuiAlert severity="success" sx={{ mb: 2 }}>{passwordSuccessMessage}</MuiAlert>}
        {passwordErrorMessage && <MuiAlert severity="error" sx={{ mb: 2 }}>{passwordErrorMessage}</MuiAlert>}
        <Box component="form" onSubmit={handleUpdatePassword} noValidate sx={{ mt: 1 }}>
          <TextField margin="normal" required fullWidth id="old_password-mobile" label="Mot de passe actuel" name="old_password" type="password" value={passwordData.old_password} onChange={handlePasswordInputChange} error={!!(passwordErrorMessage && passwordErrorMessage.toLowerCase().includes('current password'))} disabled={passwordLoading} variant="filled" />
          <TextField margin="normal" required fullWidth id="new_password1-mobile" label="Nouveau mot de passe" name="new_password1" type="password" value={passwordData.new_password1} onChange={handlePasswordInputChange} error={!!(passwordErrorMessage && passwordErrorMessage.toLowerCase().includes('new password'))} disabled={passwordLoading} variant="filled" />
          <TextField margin="normal" required fullWidth id="new_password2-mobile" label="Confirmer nouveau mot de passe" name="new_password2" type="password" value={passwordData.new_password2} onChange={handlePasswordInputChange} error={!!(passwordErrorMessage && (passwordErrorMessage.toLowerCase().includes('confirm password') || passwordErrorMessage.toLowerCase().includes('match')))} disabled={passwordLoading} variant="filled" />
          <Button type="submit" fullWidth variant="contained" color="secondary" sx={{ mt: 2 }} disabled={passwordLoading}>
            {passwordLoading ? <CircularProgress size={24} color="inherit" /> : "Changer Mot de Passe"}
          </Button>
        </Box>
      </Paper>

      {/* Add Funds Modal */}
      <Dialog open={addFundsModalOpen} onClose={handleCloseAddFundsModal} maxWidth="xs" fullWidth>
        <DialogTitle>Ajouter des Fonds</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="fundAmountMobile"
            label="Montant à ajouter"
            type="text"
            fullWidth
            variant="outlined"
            value={fundAmount}
            onChange={handleFundAmountChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
              inputMode: 'decimal',
            }}
            placeholder="0.00"
            disabled={addFundsLoading}
            sx={{mt:1}}
          />
        </DialogContent>
        <DialogActions sx={{p: 2}}>
          <Button onClick={handleCloseAddFundsModal} color="secondary" disabled={addFundsLoading}>Annuler</Button>
          <Button onClick={handleFundSubmit} variant="contained" disabled={addFundsLoading || !fundAmount || parseFloat(fundAmount) <= 0}>
            {addFundsLoading ? <CircularProgress size={24} color="inherit" /> : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Add Funds */}
      <Snackbar open={addFundsSnackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <MuiAlert onClose={handleCloseSnackbar} severity={addFundsSnackbar.severity} sx={{ width: '100%' }} elevation={6} variant="filled">
          {addFundsSnackbar.message}
        </MuiAlert>
      </Snackbar>

    </Container>
  );
}

function MobileBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<Bet[]>('/bets/');
        setBets(response.data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        console.error("Erreur lors de la récupération des paris (mobile):", axiosError);
        if (axiosError.response && axiosError.response.status === 401) {
          setError("Veuillez vous connecter pour voir vos paris.");
        } else if (axiosError.response && axiosError.response.data && axiosError.response.data.detail) {
          setError(axiosError.response.data.detail);
        } else {
          setError("Impossible de charger vos paris. Veuillez réessayer plus tard.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem('accessToken')) {
      fetchBets();
    } else {
      setError("Veuillez vous connecter pour voir vos paris.");
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 112px)', py: 2, marginBottom: '56px' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: 'center', marginTop: 4, marginBottom: '72px' }}>
        <MuiAlert severity="error">{error}</MuiAlert>
      </Container>
    );
  }

  return (
    <Container sx={{ marginTop: 2, marginBottom: '72px' }}>
      <Typography variant="h5" component="h1" gutterBottom textAlign="center">
        Mes Paris
      </Typography>
      {bets.length === 0 ? (
        <Typography sx={{ textAlign: 'center', marginTop: 3 }}>
          Il n'y a pas de paris.
        </Typography>
      ) : (
        <List sx={{ width: '100%' }}>
          {bets.map((bet) => (
            <Paper key={bet.id} elevation={2} sx={{ mb: 2 }}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                      Course: {bet.race_details.name}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        display="block"
                      >
                        Lézard: {bet.lizard_details.name}
                      </Typography>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        display="block"
                        sx={{mt: 0.5}}
                      >
                        Montant: {parseFloat(bet.amount).toFixed(2)} €
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        display="block"
                         sx={{mt: 0.5}}
                      >
                        Placé le: {new Date(bet.placed_at).toLocaleString('fr-FR')}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Container>
  );
}

function MobileRulesPage() {
  return (
    <Container sx={{ marginTop: 2, marginBottom: '72px' }}>
      <Paper elevation={2} sx={{ padding: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom textAlign="center" sx={{mb: 2}}>
          Règles du Jeu
        </Typography>
        <Box mb={2}>
          <Typography variant="h6" component="h2" gutterBottom>
            Introduction
          </Typography>
          <Typography variant="body2" paragraph>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="h6" component="h2" gutterBottom>
            Comment Parier
          </Typography>
          <Typography variant="body2" paragraph>
            Phasellus vestibulum, quam tincidunt venenatinteger vitae justo eget magna fermentum iaculis eu non diam. Nam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam, a cursus ipsum ante quis turpis. Nulla facilisi.
          </Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="h6" component="h2" gutterBottom>
            Gains et Paiements
          </Typography>
          <Typography variant="body2" paragraph>
            Maecenas tincidunt lacus at velit. Vivamus vel nulla eget eros elementum pellentesque. Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

function App() {
  const [value, setValue] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const userFromStorage = localStorage.getItem('loggedInUser');
    const accessToken = localStorage.getItem('accessToken');

    if (userFromStorage && accessToken) {
      setCurrentUser({ username: userFromStorage });
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

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setValue(0);
    else if (path === '/races') setValue(1);
    else if (path === '/bets') setValue(currentUser ? 2 : -1);
    else if (path === '/account') setValue(currentUser ? 3 : -1);
    else if (!currentUser && (path === '/login' || path === '/register')) setValue(3);
    else setValue(-1);
  }, [location, currentUser]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Djangobet</Typography>
          {currentUser && (
             <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
               Déco
             </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '56px' }}>
        <Routes>
          <Route path="/login" element={<MobileLoginPage setCurrentUser={setCurrentUser} />} />
          <Route path="/register" element={<MobileRegisterPage />} />
          <Route path="/account" element={<MobileAccountPage currentUser={currentUser} />} />
          <Route path="/races" element={<MobileRacesPage />} />
          <Route path="/bets" element={<MobileBetsPage />} />
          <Route path="/rules" element={<MobileRulesPage />} />
          <Route path="/" element={<MobileHomePage currentUser={currentUser} />} />
        </Routes>
      </Box>

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={() => {
            // Navigation is handled by RouterLink components, setValue is managed by useEffect
          }}
        >
          <BottomNavigationAction label="Accueil" icon={<HomeIcon />} component={RouterLink} to="/" />
          <BottomNavigationAction label="Courses" icon={<CasinoIcon />} component={RouterLink} to="/races" />
          {currentUser && (
            <BottomNavigationAction label="Mes Paris" icon={<StyleIcon />} component={RouterLink} to="/bets" />
          )}
          {currentUser ? (
            <BottomNavigationAction label={currentUser.username.substring(0,7)+'..'} icon={<AccountCircleIcon />} component={RouterLink} to="/account" />
          ) : (
            <BottomNavigationAction label="Compte" icon={<AccountCircleIcon />} component={RouterLink} to="/login" />
          )}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

export default App;
