# Bulk Shipping Label Creation Platform

A full-stack web application for creating shipping labels in bulk from CSV uploads. Built with Django REST Framework (backend) and React TypeScript (frontend).

## Features

- **3-Step Wizard Flow**: Upload → Review & Edit → Select Shipping → Purchase
- **CSV Upload**: Parse and import shipping data from CSV files
- **Data Validation**: Automatic validation with smart defaults for missing data
- **Address Validation**: Real-time address verification with USPS (primary) and Google (fallback)
- **Bulk Operations**: Apply saved addresses/packages to multiple shipments at once
- **Shipping Service Selection**: Choose between Priority Mail and Ground Shipping with dynamic pricing
- **Modern UI**: Clean, professional interface with loading states and error handling

## Tech Stack

### Backend
- Python 3.11
- Django 4.2.7
- Django REST Framework 3.14.0
- PostgreSQL / SQLite
- Structured logging

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router

## Project Structure

```
moheb-poc/
├── backend/                    # Django project
│   ├── shipping_platform/      # Main Django app
│   │   ├── apps/              # Application code
│   │   │   ├── models.py      # Database models
│   │   │   ├── views.py       # API views
│   │   │   ├── serializers.py # DRF serializers
│   │   │   ├── validators.py  # CSV parsing
│   │   │   ├── address_validator.py  # Address validation
│   │   │   └── pricing.py    # Price calculation
│   │   └── settings.py        # Django settings
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React TypeScript app
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API client
│   │   └── types/             # TypeScript interfaces
│   └── package.json           # Node dependencies
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.11
- Node.js 22
- PostgreSQL (optional, SQLite used by default)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Initialize sample data (saved addresses and packages):
```bash
python manage.py init_sample_data
```

6. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

7. Run the development server:
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the backend directory (optional):

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost/dbname
USPS_USER_ID=your-usps-user-id
GOOGLE_API_KEY=your-google-api-key
ALLOWED_HOSTS=localhost,127.0.0.1
```

For the frontend, create `.env` in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## API Endpoints

- `POST /api/shipments/upload/` - Upload CSV file
- `GET /api/shipments/` - List all shipments
- `GET /api/shipments/{id}/` - Get single shipment
- `PATCH /api/shipments/{id}/` - Update shipment
- `DELETE /api/shipments/{id}/` - Delete shipment
- `POST /api/shipments/bulk_update/` - Bulk update shipments
- `POST /api/shipments/bulk_delete/` - Bulk delete shipments
- `POST /api/shipments/validate_addresses/` - Validate addresses
- `GET /api/saved-addresses/` - List saved addresses
- `GET /api/saved-packages/` - List saved packages
- `GET /api/shipping-services/` - Get shipping services with prices
- `POST /api/shipping-services/bulk_update_service/` - Bulk update shipping services
- `POST /api/purchase/` - Complete purchase

## Address Validation

The application supports address validation with automatic fallback:

1. **Primary**: USPS Address Validation API (free tier)
2. **Fallback**: Google Address Validation API

To enable address validation, set the following environment variables:
- `USPS_USER_ID` - Your USPS API user ID
- `GOOGLE_API_KEY` - Your Google API key

If both APIs fail or are unavailable, the system will continue without validation and mark addresses as "pending".

## Data Validation Strategy

- **Critical Errors**: Missing Ship To address → blocks progress
- **Warnings**: Missing weight/dimensions → allows progress but highlights
- **Auto-fix**: Missing Ship From → applies default saved address
- **Status Indicators**: Color-coded badges (green/yellow/red/blue)

## CSV File Format

The CSV file must have 2 header rows and 23 columns:

**Row 1**: `From,,,,,,,To,,,,,,,weight*,weight*,Dimensions*,Dimensions*,Dimensions*,,,,,`

**Row 2**: `First name*,Last name,Address*,Address2,City*,ZIP/Postal code*,Abbreviation*,First name*,Last name,Address*,Address2,City*,ZIP/Postal code*,Abbreviation*,lbs,oz,Length,width,Height,phone num1,phone num2,order no,Item-sku`

See `Template.csv` for a sample file with 100 records.

## Design Decisions

1. **Backend Business Logic**: All validation, pricing, and data processing happens on the backend to evaluate Python skills
2. **Automatic Fallback**: Address validation automatically tries fallback APIs without user intervention
3. **Smart Defaults**: Missing Ship From addresses are automatically populated with the default saved address
4. **Dynamic Pricing**: Shipping prices calculated based on weight and dimensions
5. **Status Indicators**: Visual status badges help users quickly identify issues
6. **Bulk Operations**: Efficient bulk editing for common operations

## Assumptions

1. **US Addresses Only**: The system is designed for US addresses (US state abbreviations)
2. **Simulated Payment**: Purchase flow is simulated (no actual payment processing)
3. **Label Generation**: Label download/print is simulated
4. **Single User**: No authentication implemented (can be added)
5. **In-Memory State**: Frontend state is maintained during the wizard flow

## Known Limitations

1. Address validation requires API keys (USPS/Google)
2. No actual label generation - purchase flow is simulated
3. No user authentication - single user mode
4. CSV parsing assumes specific format (2 header rows, 23 columns)
5. Limited error recovery - some operations require page refresh

## Testing

1. Upload the provided `Template.csv` file
2. Review and edit shipments in Step 2
3. Select shipping services in Step 3
4. Complete purchase flow

Test edge cases:
- Missing Ship From addresses (should auto-apply default)
- Missing weights/dimensions (should show warnings)
- Invalid addresses (should show validation status)
- Bulk operations on multiple shipments

## Deployment

### Backend Deployment

Recommended platforms:
- Railway
- Render
- PythonAnywhere
- Heroku

Set environment variables and ensure PostgreSQL is configured.

### Frontend Deployment

Recommended platforms:
- Vercel
- Netlify
- Same platform as backend

Update `VITE_API_BASE_URL` to point to your backend URL.

## Logging

Structured logging is implemented with JSON format. Logs are written to:
- Console (stdout)
- `backend/logs/shipping_platform.log`

Log levels:
- INFO: Normal operations
- WARNING: Fallbacks, missing data
- ERROR: Failures, exceptions

## License

This is a technical assessment project.

## Author

Built as a POC for bulk shipping label creation platform.
