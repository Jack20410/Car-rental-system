car-rental-system/
├── services/
│   ├── user-service/     # Combined Auth + User
│   ├── vehicle-service/
│   ├── rental-service/       # Includes booking + reviews
│   ├── payment-service/      # Includes promotions
│   ├── notification-service/
│   ├── support-service/
│   ├── admin-service/        # Admin + reporting
│   └── api-gateway/
├── libs/
│   ├── common/               # Shared utilities
│   ├── models/               # Shared data models
│   └── events/               # Event definitions
├── docker-compose.yml
├── package.json
└── .gitignore