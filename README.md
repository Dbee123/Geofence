# | Geofence Backend (Django + DRF)

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)  
[![Django](https://img.shields.io/badge/Django-REST%20Framework-green.svg)](https://www.django-rest-framework.org/)  
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

This branch contains the **backend** of the Geofencing System, built with **Django** and **Django REST Framework (DRF)**.  
It exposes APIs for the **Field Log (React Native)** and **Web Portal (React.js)** applications.

---

## Features
- User authentication & role management  
- Admin portal for system management  
- API endpoints for geofencing operations  
- Secure backend with DRF best practices  

---

## Installation & Setup

### Clone the Repository
```bash
git clone https://github.com/Dbee123/Geofence.git
cd Geofence
git checkout main
```

### Create & Activate Virtual Environment
```bash
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
```

### Install Dependencies

Before installing, make sure GDAL is installed and configured.

Ubuntu/Debian:
```bash
sudo apt-get install gdal-bin libgdal-dev
```

Mac (Homebrew):
```bash
brew install gdal
```

Windows:
Download binaries from GIS Internals

Then install Python dependencies:

```bash
pip install -r requirements.txt
```
### Apply Migrations
```bash
python manage.py migrate
```
### Create Superuser
```bash
python manage.py createsuperuser
```
### Run the Server
```bash
python manage.py runserver
```

Access the admin panel:
 http://127.0.0.1:8000/admin

Post-Setup Configuration

Log in with your superuser credentials.

Navigate to Users → Select your profile.

Update your role to Admin.

 Your backend is ready to use!
