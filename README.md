# Project Setup & Run Guide

This project is built with **NestJS**, **TypeORM**, **PostgreSQL**, and **Docker**.  
Follow these steps to set up and run the application locally.

---

## 1. Prerequisites

Make sure you have the following installed:

- **Docker** & **Docker Compose**
- **Node.js** (v18+ recommended)
- **Yarn** or **npm**

---

## 2. Environment Configuration

Copy the example environment file and update it if necessary:

```bash
cp .env.example .env
```

> **Note:**  
> The `.env.example` file is pre-configured for local development using Docker.  
> You usually don’t need to change anything unless you have port conflicts.

---

## 3. Start the Application

Run the following command to build and start all services:

```bash
docker compose up --build
```

This will:

- Start **PostgreSQL**, **Redis**, and any other required services
- Build and start the **NestJS API** container
- Run database migrations and synchronize the schema automatically

---

## 4. Explore the API

Once the containers are up and running, open the Swagger UI for documentation and testing:

[http://localhost:3000/api](http://localhost:3000/api)

---

## 5. Stopping the Services

To stop the containers:

```bash
docker compose down
```

To stop and remove volumes (reset the database):

```bash
docker compose down -v
```

---

## Feedback

I’m always looking to **improve my code and approach**.

    Feedback and results are appreciated, even if they are negative
