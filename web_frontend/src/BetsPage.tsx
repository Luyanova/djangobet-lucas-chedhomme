import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Box, Paper, List, ListItem, Grid, Alert } from '@mui/material';
import apiClient from './config';

interface LizardMinimal {
  id: number;
  name: string;
}

interface RaceMinimal {
  id: number;
  name: string;
}

interface Bet {
  id: number;
  race_details: RaceMinimal;
  lizard_details: LizardMinimal;
  amount: string;
  placed_at: string;
}

const BetsPage: React.FC = () => {
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
      } catch (err: any) {
        console.error("Erreur lors de la récupération des paris:", err);
        if (err.response && err.response.status === 401) {
          setError("Veuillez vous connecter pour voir vos paris.");
        } else {
          setError("Impossible de charger vos paris. Veuillez réessayer plus tard.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch bets if a token exists (user is likely logged in)
    if (localStorage.getItem('accessToken')) {
        fetchBets();
    } else {
        setError("Veuillez vous connecter pour voir vos paris.");
        setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: 'center', marginTop: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom textAlign="center">
        Mes Paris
      </Typography>
      {bets.length === 0 ? (
        <Typography sx={{ textAlign: 'center', marginTop: 3 }}>
          Il n'y a pas de paris.
        </Typography>
      ) : (
        <Paper elevation={2} sx={{ marginTop: 2 }}>
          <List>
            {bets.map((bet) => (
              <ListItem key={bet.id} divider>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle1" component="div">Course: {bet.race_details.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                     <Typography variant="body1">Lézard: <Box component="span" sx={{fontWeight: 'bold'}}>{bet.lizard_details.name}</Box></Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="body1">Montant: {parseFloat(bet.amount).toFixed(2)} €</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">
                      Placé le: {new Date(bet.placed_at).toLocaleString('fr-FR')}
                    </Typography>
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default BetsPage; 