import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Optional: if you want a back button

const RulesPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ marginTop: 4, marginBottom: 4 }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          Règles du Jeu Djangobet
        </Typography>
        
        <Box my={2}>
          <Typography variant="h5" component="h2" gutterBottom>
            Introduction
          </Typography>
          <Typography paragraph>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </Typography>
        </Box>

        <Box my={2}>
          <Typography variant="h5" component="h2" gutterBottom>
            Comment Parier
          </Typography>
          <Typography paragraph>
            Phasellus vestibulum, quam tincidunt venenatinteger vitae justo eget magna fermentum iaculis eu non diam. Nam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam, a cursus ipsum ante quis turpis. Nulla facilisi. Ut fringilla. Suspendisse potenti. Nunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam. Etiam ultrices. Suspendisse in justo eu magna luctus suscipit.
          </Typography>
          <Typography paragraph>
            Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Morbi lacinia molestie dui. Praesent blandit dolor. Sed non quam. In vel mi sit amet augue congue elementum. Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel, egestas et, augue.
          </Typography>
        </Box>

        <Box my={2}>
          <Typography variant="h5" component="h2" gutterBottom>
            Gains et Paiements
          </Typography>
          <Typography paragraph>
            Maecenas tincidunt lacus at velit. Vivamus vel nulla eget eros elementum pellentesque. Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus. Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh.
          </Typography>
        </Box>

        {/* Optional: Back to Account button 
        <Box textAlign="center" mt={3}>
          <Button component={RouterLink} to="/account" variant="outlined">
            Retour au Compte
          </Button>
        </Box>
        */}
      </Paper>
    </Container>
  );
};

export default RulesPage; 