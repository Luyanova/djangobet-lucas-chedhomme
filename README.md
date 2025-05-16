# DjangoBet Project 
Résumé Étape par Étape du Développement

Le développement de Djangobet a suivi une progression logique, construisant méthodiquement les fonctionnalités backend et frontend.

A. Backend (Django & Django REST Framework)

Initialisation et Configuration :

- Mise en place d'un environnement virtuel et installation de Django et Django REST Framework (DRF)
- Création du projet djangobet_project et de l'application core_api

Configuration de [settings.py](http://settings.py) :

- Ajout des applications nécessaires à INSTALLED_APPS : rest_framework, core_api, corsheaders, rest_framework_simplejwt
- Intégration de corsheaders.middleware.CorsMiddleware dans MIDDLEWARE
- Configuration de CORS_ALLOWED_ORIGINS pour les frontends (http://localhost:5173, http://localhost:5174)
- Mise en place de JWTAuthentication par défaut et configuration des durées de validité des tokens JWT

Définition des Modèles (core_api/models.py) :

- Lizard : Modèle représentant un lézard (propriétaire, nom, espèce, âge)
- Race : Modèle de course (nom, date planifiée, statut, participants, gagnant optionnel)
- Bet : Modèle de pari (utilisateur, course, lézard, montant, date automatique)
- Création des tables via migrations

Création des Sérialiseurs (core_api/serializers.py) :

- UserSerializer : Inscription des utilisateurs avec hachage du mot de passe
- LizardSerializer : Gestion complète des données des lézards
- RaceSerializer : Inclusion des détails des participants et du gagnant
- UserProfileSerializer : Gestion du profil utilisateur
- ChangePasswordSerializer : Validation des modifications de mot de passe
- MinimalLizardSerializer et MinimalRaceSerializer : Représentations simplifiées
- BetSerializer : Optimisé pour la création et l'affichage des paris

Implémentation des Vues (core_api/views.py) :

- UserCreateView : Création d'utilisateurs
- LizardViewSet, RaceViewSet, BetViewSet : Opérations CRUD sécurisées
- UserProfileView : Gestion du profil
- ChangePasswordView : Modification du mot de passe

Configuration des URLs et Administration :

- Organisation des routes API dans core_api/urls.py
- Configuration des endpoints JWT dans djangobet_project/urls.py
- Interface d'administration pour Lizard, Race et Bet

B. Frontends (React, Vite, TypeScript, MUI, Tailwind)

Configuration Commune :

- Création des projets web_frontend et mobile_frontend
- Installation des dépendances : tailwindcss, @mui/material, @emotion/react, @emotion/styled, @mui/icons-material, react-router-dom, axios
- Configuration de Tailwind CSS et des fichiers de base
- Mise en place d'Axios avec gestion des tokens JWT

Frontend Web :

- App.tsx : Routage, gestion utilisateur et navigation
- Pages principales : Accueil, Connexion, Inscription, Profil
- RacesPage : Affichage et interaction avec les courses
- BetsPage : Gestion des paris utilisateur

Frontend Mobile :

- Structure adaptée avec navigation inférieure
- Versions mobiles des composants principaux
- Fonctionnalités de paris optimisées pour mobile

C. Améliorations Notables :

- Enrichissement des données de course avec les détails des participants
- Optimisation de la gestion des paris
- Interface modale de paris adaptative
- Corrections des erreurs TypeScript

II. Concepts Clés

Le projet s'appuie sur plusieurs concepts fondamentaux :

Modèles Django :

- Source unique de vérité pour les données
- ORM puissant pour les interactions base de données
- Relations sophistiquées entre entités

Sérialiseurs DRF :

- Conversion et validation des données
- Sérialisation imbriquée pour les relations complexes
- Gestion fine des champs en lecture/écriture

Vues DRF :

- Logique métier de l'API
- ViewSets pour les opérations CRUD
- Système de permissions robuste

CORS et Sécurité :

# Cross-Origin Resource Sharing

What is Cross-Origin Resource Sharing? Cross-origin resource sharing (CORS) is **a mechanism for integrating applications**. CORS defines a way for client web applications that are loaded in one domain to interact with resources in a different domain.

- Gestion des requêtes cross-origin
- Configuration adaptée aux environnements de développement

Authentication JWT :

- Système stateless sécurisé
- Gestion des tokens d'accès et de rafraîchissement
- Intégration côté client via Axios

React et État :

- Composants réutilisables
- Gestion efficace de l'état avec les Hooks
- Interactions asynchrones optimisées

Technologies Frontend :

- Vite : Build rapide et développement optimisé
- TypeScript : Typage statique et fiabilité
- MUI et Tailwind : Interface utilisateur flexible et moderne

III. Points Forts de la Stack

L'architecture choisie offre plusieurs avantages :

Backend (Django & DRF) :

- Développement API rapide et sécurisé
- ORM puissant et administration intégrée
- Écosystème mature et communauté active

Frontend (React, Vite, TypeScript) :

- Interface réactive et performante
- Développement efficace et maintenable
- Excellent support des outils modernes

Design et Expérience Utilisateur :

- Composants Material-UI élégants
- Personnalisation flexible avec Tailwind

Architecture et Scalabilité :

- Séparation claire backend/frontend
- Indépendance des composants
- Choix technologiques adaptés aux besoins

IV. Conclusion

Djangobet démontre une maîtrise approfondie des technologies web modernes. L'application allie une API robuste sous Django/DRF à des interfaces réactives en React/TypeScript. L'attention portée à la sécurité, à l'expérience utilisateur et aux bonnes pratiques de développement en fait une base solide pour de futures évolutions.




Liens vers le rapport de Gemini : https://docs.google.com/document/d/1atf-H5XmQgfvl23afBVfpZrEt1WIF3dISbzda1K5BfQ/edit?usp=sharing
