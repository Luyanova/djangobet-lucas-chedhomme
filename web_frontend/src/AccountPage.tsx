import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, TextField, Button, Paper, Box, Alert, CircularProgress, Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment } from '@mui/material';
import apiClient from './config'; // Corrected to default import
import axios from 'axios'; // Added for Axios type guards

// Updated User interface to reflect more details
interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  funds?: number; // Added funds field, optional for initial state before loading
}

interface AccountPageProps {
  currentUser: { username: string } | null; // This might need to be updated in App.tsx later
  // setCurrentUser: (user: UserProfile | null) => void; // If we want to propagate full profile up
}

const AccountPage: React.FC<AccountPageProps> = ({ currentUser /*, setCurrentUser */ }) => {
  const navigate = useNavigate();

  // State for profile form
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    email: '',
    first_name: '',
    last_name: '',
    funds: 0, // Initialize funds
  });
  const [initialProfileLoading, setInitialProfileLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [profileErrorMessage, setProfileErrorMessage] = useState('');

  // State for password change form
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
  const [addFundsMessage, setAddFundsMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
          email: response.data.email,
          first_name: response.data.first_name || '', // Handle null from backend if applicable
          last_name: response.data.last_name || '',   // Handle null from backend if applicable
          funds: response.data.funds !== undefined ? Number(response.data.funds) : 0, // Ensure funds is a number
        });
        // If setCurrentUser is passed and equipped to handle UserProfile:
        // setCurrentUser(response.data) 
      } catch (error: any) {
        console.error('Failed to fetch user profile:', error);
        setProfileErrorMessage(error.response?.data?.detail || 'Failed to load profile. Please try again.');
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

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
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
      // Username and ID are not sent as they are read-only or not part of the update
      await apiClient.put('/profile/', payload);
      setProfileSuccessMessage('Profile updated successfully!');
      // Optionally re-fetch profile or update local state if response contains updated data
      // For example, if the backend returns the full updated profile:
      // const response = await apiClient.put<UserProfile>('/profile/', payload);
      // setProfile(response.data); 
      // If email is part of currentUser in App.tsx and needs update:
      // if (currentUser && setCurrentUser) {
      //   setCurrentUser({...currentUser, email: response.data.email });
      // }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errors = error.response?.data;
      if (errors) {
        let messages = [];
        if (errors.email) messages.push(`Email: ${errors.email.join(', ')}`);
        if (errors.first_name) messages.push(`First Name: ${errors.first_name.join(', ')}`);
        if (errors.last_name) messages.push(`Last Name: ${errors.last_name.join(', ')}`);
        if (errors.detail) messages.push(errors.detail);
        setProfileErrorMessage(messages.length > 0 ? messages.join('; ') : 'Failed to update profile.');
      } else {
        setProfileErrorMessage('Failed to update profile. Please try again.');
      }
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
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
    // Add any other client-side validation for password strength if desired

    try {
      await apiClient.put('/profile/change-password/', passwordData);
      setPasswordSuccessMessage('Password updated successfully!');
      setPasswordData({ old_password: '', new_password1: '', new_password2: '' }); // Clear fields
    } catch (error: any) {
      console.error('Failed to update password:', error);
      const errors = error.response?.data;
      if (errors) {
        let messages = [];
        if (errors.old_password) messages.push(`Current Password: ${errors.old_password.join(', ')}`);
        if (errors.new_password1) messages.push(`New Password: ${errors.new_password1.join(', ')}`);
        if (errors.new_password2) messages.push(`Confirm Password: ${errors.new_password2.join(', ')}`);
        if (errors.detail) messages.push(errors.detail);
        // Handle non_field_errors if your backend sends them
        if (errors.non_field_errors) messages.push(errors.non_field_errors.join(', '));
        setPasswordErrorMessage(messages.length > 0 ? messages.join('; ') : 'Failed to update password.');
      } else {
        setPasswordErrorMessage('Failed to update password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleOpenAddFundsModal = () => {
    setFundAmount('');
    setAddFundsMessage(null);
    setAddFundsModalOpen(true);
  };

  const handleCloseAddFundsModal = () => {
    setAddFundsModalOpen(false);
  };

  const handleFundAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Replace comma with dot for consistent decimal separation and validation
    const valueForValidation = inputValue.replace(',', '.');

    // Allow only numbers and at most one dot decimal separator
    if (/^\d*\.?\d*$/.test(valueForValidation)) {
      // Store the value with the dot (normalized) if it's valid.
      setFundAmount(valueForValidation);
    }
    // If the input (after normalization) doesn't match the regex,
    // setFundAmount is not called, so the input field doesn't update,
    // effectively preventing invalid characters or formats like "1.2.3".
  };

  const handleFundSubmit = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      setAddFundsMessage({ type: 'error', message: 'Veuillez entrer un montant valide.' });
      return;
    }
    setAddFundsLoading(true);
    setAddFundsMessage(null);
    try {
      const response = await apiClient.post('/profile/add-funds/', { amount: parseFloat(fundAmount).toFixed(2) });
      setProfile(prev => ({ ...prev, funds: parseFloat(response.data.new_balance) }));
      setAddFundsMessage({ type: 'success', message: response.data.message || 'Fonds ajoutés avec succès !' });
      setTimeout(() => {
        handleCloseAddFundsModal();
      }, 1500); // Close modal after a short delay on success
    } catch (err: unknown) {
      console.error('Failed to add funds:', err); 
      let displayMessage = 'Erreur lors de l\'ajout des fonds. Veuillez réessayer.';

      if (axios.isAxiosError(err)) { 
        console.log('Full Axios error object:', err);
        if (err.response) {
          console.log('Error response data:', err.response.data);
          const respData = err.response.data;
          if (respData) {
            if (typeof respData === 'string') {
              displayMessage = respData;
            } else if (respData.amount && Array.isArray(respData.amount) && respData.amount.length > 0) {
              displayMessage = respData.amount.join(', ');
            } else if (respData.detail && typeof respData.detail === 'string') {
              displayMessage = respData.detail;
            } else if (respData.message && typeof respData.message === 'string') {
              displayMessage = respData.message;
            } else if (typeof respData === 'object' && respData !== null) {
              // Attempt to extract other error messages if the structure is {field: [errors], ...}
              const errorMessages = Object.values(respData).flat().join('; ');
              if (errorMessages) displayMessage = errorMessages;
            }
            
            if (displayMessage === 'Erreur lors de l\'ajout des fonds. Veuillez réessayer.') { // if no specific message was extracted
                 if (err.response.status === 400) {
                    displayMessage = 'Données invalides. Veuillez vérifier le montant et réessayer.';
                } else if (err.response.status === 500) {
                    displayMessage = 'Erreur du serveur. Veuillez réessayer plus tard.';
                }
            }
          }
        } else if (err.request) {
          console.log('Error request data:', err.request);
          displayMessage = 'Pas de réponse du serveur. Vérifiez votre connexion internet.';
        } else {
          console.log('Error message:', err.message);
          displayMessage = 'Erreur lors de la préparation de la requête.';
        }
      } else {
        console.log('Non-Axios error:', err);
        if (err instanceof Error) {
          displayMessage = err.message;
        }
      }
      setAddFundsMessage({ type: 'error', message: displayMessage });
    } finally {
      setAddFundsLoading(false);
    }
  };

  if (!currentUser) {
    // This should ideally be handled by a ProtectedRoute or similar higher-order component
    // For now, redirecting if useEffect hasn't caught it yet or if navigated here directly without user
    return (
      <Container sx={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading user...</Typography>
        <CircularProgress />
      </Container>
    );
  }
  
  if (initialProfileLoading) {
    return (
      <Container sx={{ marginTop: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography sx={{mt: 2}}>Loading profile...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ marginTop: 4, maxWidth: 'md' }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        Mon Compte
      </Typography>
      <Typography variant="h6" component="p" gutterBottom textAlign="center" sx={{ mb: 3 }}>
        Bonjour, {currentUser.username} !
      </Typography>

      {/* Display Funds */}
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h5" component="h2" gutterBottom textAlign="center">
          Mes Fonds Actuels
        </Typography>
        <Typography variant="h4" component="p" textAlign="center" sx={{ fontWeight: 'bold' }}>
          {initialProfileLoading ? <CircularProgress size={20} color="inherit"/> : `${(profile.funds ?? 0).toFixed(2)} €`}
        </Typography>
        <Box textAlign="center" sx={{mt: 2}}>
            <Button variant="contained" color="secondary" onClick={handleOpenAddFundsModal}>
                Ajouter des Fonds
            </Button>
        </Box>
      </Paper>

      {/* Profile Update Form */}
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Mettre à jour le profil
        </Typography>
        {profileSuccessMessage && <Alert severity="success" sx={{ mb: 2 }}>{profileSuccessMessage}</Alert>}
        {profileErrorMessage && <Alert severity="error" sx={{ mb: 2 }}>{profileErrorMessage}</Alert>}
        <Box component="form" onSubmit={handleUpdateProfile} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            id="username_display" // Changed id
            label="Nom d'utilisateur"
            name="username_display" // Changed name
            value={currentUser.username} // Display current username
            disabled // Username is not editable
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Adresse e-mail"
            name="email"
            type="email"
            value={profile.email || ''}
            onChange={handleProfileInputChange}
            error={!!(profileErrorMessage && profileErrorMessage.toLowerCase().includes('email'))}
            disabled={profileLoading}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="first_name"
            label="Prénom"
            name="first_name"
            value={profile.first_name || ''}
            onChange={handleProfileInputChange}
            disabled={profileLoading}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="last_name"
            label="Nom de famille"
            name="last_name"
            value={profile.last_name || ''}
            onChange={handleProfileInputChange}
            disabled={profileLoading}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
            disabled={profileLoading}
          >
            {profileLoading ? <CircularProgress size={24} color="inherit" /> : "Sauvegarder Profil"}
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Paper elevation={2} sx={{ padding: 3, mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Règles du Jeu
        </Typography>
        <Typography paragraph>
          Consultez les règles complètes de Djangobet pour comprendre toutes les subtilités des paris sur les courses de lézards.
        </Typography>
        <Button component={RouterLink} to="/rules" variant="contained" color="info" sx={{ mt: 1 }}>
          Voir les Règles
        </Button>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Password Change Form */}
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Changer de mot de passe
        </Typography>
        {passwordSuccessMessage && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccessMessage}</Alert>}
        {passwordErrorMessage && <Alert severity="error" sx={{ mb: 2 }}>{passwordErrorMessage}</Alert>}
        <Box component="form" onSubmit={handleUpdatePassword} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="old_password"
            label="Mot de passe actuel"
            type="password"
            id="old_password"
            value={passwordData.old_password}
            onChange={handlePasswordInputChange}
            error={!!(passwordErrorMessage && passwordErrorMessage.toLowerCase().includes('current password'))}
            disabled={passwordLoading}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="new_password1"
            label="Nouveau mot de passe"
            type="password"
            id="new_password1"
            value={passwordData.new_password1}
            onChange={handlePasswordInputChange}
            error={!!(passwordErrorMessage && passwordErrorMessage.toLowerCase().includes('new password'))}
            disabled={passwordLoading}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="new_password2"
            label="Confirmer le nouveau mot de passe"
            type="password"
            id="new_password2"
            value={passwordData.new_password2}
            onChange={handlePasswordInputChange}
            error={!!(passwordErrorMessage && (passwordErrorMessage.toLowerCase().includes('confirm password') || passwordErrorMessage.toLowerCase().includes('match')))}
            disabled={passwordLoading}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            sx={{ mt: 2 }}
            disabled={passwordLoading}
          >
            {passwordLoading ? <CircularProgress size={24} /> : "Changer le mot de passe"}
          </Button>
        </Box>
      </Paper>

      {/* Add Funds Modal */}
      <Dialog open={addFundsModalOpen} onClose={handleCloseAddFundsModal} maxWidth="xs" fullWidth>
        <DialogTitle>Ajouter des Fonds</DialogTitle>
        <DialogContent>
          {addFundsMessage && (
            <Alert severity={addFundsMessage.type} sx={{ mb: 2 }}>
              {addFundsMessage.message}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="fundAmount"
            label="Montant à ajouter"
            type="text" // Use text to allow custom validation for decimal
            fullWidth
            variant="outlined"
            value={fundAmount}
            onChange={handleFundAmountChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
              inputMode: 'decimal', // Helps with mobile keyboards
            }}
            placeholder="0.00"
            disabled={addFundsLoading}
            sx={{mt:1}}
          />
        </DialogContent>
        <DialogActions sx={{p: '16px 24px'}}>
          <Button onClick={handleCloseAddFundsModal} color="secondary" disabled={addFundsLoading}>Annuler</Button>
          <Button onClick={handleFundSubmit} variant="contained" disabled={addFundsLoading || !fundAmount || parseFloat(fundAmount) <= 0}>
            {addFundsLoading ? <CircularProgress size={24} color="inherit" /> : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default AccountPage; 