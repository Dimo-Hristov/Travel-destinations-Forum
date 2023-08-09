# Project Documentation

## Overview

This document provides a brief overview of the project and its architecture.

## Project Description

Trip Forum - Explore, Share, and Discover Destinations

1. Explore Section: Immerse yourself in the captivating beauty of mountains, seas, and towns from every corner of the globe. Browse through stunning images and engaging descriptions that capture the essence of each destination.

2. Contribute Your Discoveries: As a registered user, you have the opportunity to share your own travel treasures with the world. Whether you've hiked the highest peaks, lounged on pristine beaches, or wandered through charming towns, your unique insights can inspire fellow travelers.

3. Categorized Sections: Seamlessly navigate between the Mountain, Sea, and Town sections, each meticulously curated to provide a tailored experience for every type of wanderlust. Find hidden gems, explore well-known spots, and embark on new adventures based on your preferences.

4. User-Generated Content: Experience the world through the eyes of real travelers, ensuring authentic and valuable insights for your next adventure.

5. Easy Contribution: Adding a destination is a breeze – simply upload images, provide a captivating description, and help others discover the beauty you've encountered.

## Project Architecture

The Trip Forum is built using the Angular framework, providing a modular and organized architecture for a seamless user experience. The application architecture consists of several key components and services that work together to create a dynamic and engaging platform.

Components

1. Header Component: Provides navigation links to different sections of the forum and user account-related options.

2. Footer Component: Provides some useful tips for traveling.

3. Destinations-list Component: Displays a list of all destinations sorted by amound of likes. Communicates with the backend API to retrieve destinations data.

4. Current-destination component: Shows detailed information about a selected destination, including images, description, and likes.

5. Login component: The Login Component is a crucial part of the Trip Forum's user authentication system. It provides users with a secure and streamlined process to log into their accounts, granting them access to personalized features and interactions within the platform.

6. Register component:The Register Component plays a pivotal role in the Trip Forum's user onboarding process, allowing new users to create accounts and join the platform's community of travelers and explorers.

7. The Profile Component is a place where the users can see their liked and uploaded destinations.

8. Main component: It a place where guest can filter the destinations by their type.

9. The Add Destination Component empowers users to contribute their unique travel experiences to the Trip Forum, enriching the platform with diverse and captivating destinations for others to explore.

10. User Component: Manages user profiles, displaying user information, contributed destinations, and badges.

11. Add-destination component: The Add Destination Component empowers users to contribute their unique travel experiences to the Trip Forum, enriching the platform with diverse and captivating destinations for others to explore.

12. Edit Destination Component: The Edit Destination Component offers users the ability to modify and update the details of destinations they have contributed to the Trip Forum. It provides a seamless and efficient way to keep destination information accurate and engaging.

## Services

1. DestinationService: Handles communication with the backend API to fetch and update destination data. Provides methods for fetching specific destination details, submitting new destinations, edit destination, delete destination.

2. UserService: Manages user authentication, registration, and login.

3. apiSeruvice: Handles communication with the backend API to fetch likesList and destinationsList.

# Types

Destination: Defines the structure of a destination, including properties like name, category, description, images, and user comments.

Like: Defines the structure of a like, including properties like OwnerId, album Id and more.

User: Represents user data, including username, profile information, and contributed destinations.

## Routes

The Trip Forum utilizes Angular's routing module to manage different views and sections of the application:

/: Home page with a selection of categories (Mountain, Sea, Town).
/category/:categoryType: Displays a list of destinations based on the selected category.
/destination/:destinationId: Shows detailed information about a selected destination.
/profile: User profile page displaying user information and contributed destinations.
Data Flow
The user interacts with the application by selecting a category, exploring destinations, or viewing user profiles.

The component communicates with the relevant services (e.g., DestinationService, UserService) to fetch or update data.

Services interact with the backend API to retrieve destination or user information and manage user authentication.

The retrieved data is displayed in the components, and users can contribute new destinations, and engage with the community.

# TripForum

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Backend Service

This is the softuni practice server.
To go server folder and run `node server.js`.
Its will start to listen on `http://localhost:3030`
