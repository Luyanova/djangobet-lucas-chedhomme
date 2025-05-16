import React from 'react';
import { Container, Typography, CircularProgress, Box, Paper, Button, Grid, Chip, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel, Alert as MuiAlert, Snackbar } from '@mui/material';
import { useState, useEffect } from 'react';
import apiClient from './config';

// Interfaces
interface Lizard {
  id: number;
  name: string;
}

interface Race {
  id: number;
  name: string;
  scheduled_at: string;
  status: 'upcoming' | 'ongoing' | 'finished' | 'cancelled';
  participants: Lizard[];
  winner: Lizard | null;
}

const RacesPage: React.FC = () => {
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
        console.error("Erreur lors de la récupération des courses:", err);
        setError("Impossible de charger les courses. Veuillez réessayer plus tard ou vérifier votre connexion.");
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
    } catch (err: any) {
      console.error("Erreur lors du placement du pari:", err);
      let errorMessage = "Impossible de placer le pari. Veuillez réessayer.";
      
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
            } else if (typeof err.response.data === 'string') { 
                 errorMessage = err.response.data;
            }
        }
      } else if (err.request) { // Axios error without response (network issue)
        errorMessage = "Aucune réponse du serveur. Vérifiez votre connexion.";
      } else { // Non-Axios error
        errorMessage = err.message || "Une erreur inconnue s'est produite.";
      }
      setBetFormFeedback({ type: 'error', message: errorMessage });
    } finally {
      setBetSubmitting(false);
    }
  };

  const getStatusChipColor = (status: Race['status']) => {
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
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !races.length) {
    return (
      <Container sx={{ textAlign: 'center', marginTop: 4 }}>
        <MuiAlert severity="error">{error}</MuiAlert>
      </Container>
    );
  }

  const renderRaceList = (title: string, raceList: Race[]) => {
    if (raceList.length === 0 && !loading) {
      if (title === "Courses à venir" && !error && races.filter(r => r.status === 'upcoming').length === 0) {
        return <Typography sx={{mb:2, textAlign:'center'}}>Aucune course à venir pour le moment.</Typography>;
      }
      return null; 
    }
    return (
      <Box mb={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
        <Grid container spacing={2}>
          {raceList.map((race) => (
            <Grid item xs={12} sm={6} md={4} key={race.id}>
              <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" component="h3">{race.name}</Typography>
                  <Chip
                    label={getStatusChipLabel(race.status)}
                    color={getStatusChipColor(race.status)}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Prévue le: {new Date(race.scheduled_at).toLocaleString('fr-FR')}
                  </Typography>
                  <Typography variant="body2">
                    Participants: {race.participants.map(p => p.name).join(', ') || 'Aucun pour le moment'}
                  </Typography>
                  {race.status === 'finished' && race.winner && (
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      Gagnant: {race.winner.name}
                    </Typography>
                  )}
                </Box>
                {race.status === 'upcoming' && (
                  <Button
                    variant="contained"
                    color="primary"
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
                    sx={{ mt: 2 }}
                  >
                    Voir les paris
                  </Button>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        Les Courses de Lézards
      </Typography>

      {error && <MuiAlert severity="error" sx={{mb:2}}>{error}</MuiAlert>}

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {betFormFeedback?.message && (
            <MuiAlert onClose={() => setSnackbarOpen(false)} severity={betFormFeedback?.type || 'info'} sx={{ width: '100%' }}>
                {betFormFeedback.message}
            </MuiAlert>
        )}
      </Snackbar>

      {races.length === 0 && !loading && !error && (
         <Typography sx={{ textAlign: 'center', mt: 3 }}>Aucune course à afficher pour le moment.</Typography>
      )}
      {renderRaceList("Courses à venir", upcomingRaces)}
      {renderRaceList("Courses en cours", ongoingRaces)}
      {renderRaceList("Courses terminées", finishedRaces)}
      {renderRaceList("Courses annulées", cancelledRaces)}

      {selectedRaceForBet && (
        <Dialog open={betModalOpen} onClose={handleCloseBetModal} fullWidth maxWidth="xs">
          <DialogTitle>Parier sur: {selectedRaceForBet.name}</DialogTitle>
          <DialogContent>
            {betFormFeedback && betFormFeedback.type === 'error' && (
                <MuiAlert severity="error" sx={{ mb: 2 }}>{betFormFeedback.message}</MuiAlert>
            )}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="lizard-select-label">Choisir un Lézard</InputLabel>
              <Select
                labelId="lizard-select-label"
                id="lizard-select"
                value={selectedLizardId}
                label="Choisir un Lézard"
                onChange={(e) => setSelectedLizardId(e.target.value as string | number)}
                disabled={betSubmitting}
              >
                <MenuItem value="" disabled><em>Sélectionnez un participant</em></MenuItem>
                {selectedRaceForBet.participants.length > 0 ? (
                  selectedRaceForBet.participants.map((lizard) => (
                    <MenuItem key={lizard.id} value={lizard.id}>
                      {lizard.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled><em>Aucun participant disponible pour cette course</em></MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              id="betAmount"
              label="Montant du Pari (€)"
              type="number"
              fullWidth
              variant="outlined"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              sx={{ mt: 3 }}
              InputProps={{
                inputProps: { min: "0.01", step: "0.01" } 
              }}
              disabled={betSubmitting}
            />
          </DialogContent>
          <DialogActions sx={{pb:2, pr:2}}>
            <Button onClick={handleCloseBetModal} disabled={betSubmitting} color="secondary">Annuler</Button>
            <Button onClick={handleBetSubmit} variant="contained" disabled={betSubmitting || !selectedLizardId || !betAmount}>
              {betSubmitting ? <CircularProgress size={24} /> : "Parier"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default RacesPage; 