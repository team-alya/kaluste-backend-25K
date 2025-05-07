# kaluste-backend

Älyä-hankkeessa KalusteArvio-projektin palvelin ja tekoälyliittymät

## Table of Contents

- [Technologies](#technologies)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Docker Instructions](#docker-instructions)
- [Vision Pipeline](#vision-pipeline)
- [Database](#database)

## Technologies

- TypeScript
- Node.js
- Express.js
- OpenAI API
- SerpApi API
- MongoDB
- Docker
  
## Installation

### Enviromental variables

Create an .env file in the root folder with the following values (use the .env.example file for reference):

- OPENAI_API_KEY
- MONGODB_URI
- PORT
- ANTHROPIC_API_KEY
- SERPAPI_API_KEY
- JWT_SECRET


### Initialize server

```
npm run i
```

#### Run in development mode

```
npm run dev
```

#### Run in production mode

```
npm run build
npm run start
```

## API Documentation

### Roadmap

📷 Taken Photo → /api/photo → /api/image → /api/price → /api/evaluation/check ⇄ /api/evaluation

### Route details

Below is a list of available API endpoints in this project, grouped by functionality.

| HTTP | Route | Description                                      |
| ---- | ----- | ------------------------------------------------ |
| GET  | /ping | Sends a request to validate the server is running |

| HTTP | Route | Description                                      | 
| ---- | ----- | ------------------------------------------------ |
| POST  | /api/photo | Analyzes the uploaded image quality. Returns a message indicating whether the photo is good or should be retaken. Send an image in raw binary format using HTML multipart/form-data |

| HTTP | Route      | Description                                                                                                                                                  |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST | /api/image | Sends the image to the AI for analysis. Returns initial form data including detected brand/model, furniture details and estimated price reasoning. The suggested price is not editable via the UI at the analysis step. Send an image in raw binary format using HTML multipart/form-data. Key must be "image" and the image itself as value to recieve an analysis of the furniture |

| HTTP | Route      | Description                                                                                                                                                  |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET | api/image/:id | This endpoint returns the image based on its ID. The ID is from the 'imageId' field inside the evaluation object |

| HTTP | Route      | Description                                                                                                                                                  |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST | /api/evaluation/check | Checks whether the furniture is needed in stock based on the brand/model and if not AI will check it via furniture details and image. Returns a message indicating demand status to the user. Send brand and model, other furniture details and image in the request body to receive message if furniture is needed |


### CRUD operations for storing, updating, or removing furniture item data in the database

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET  | /api/evaluation/all | Gets all furniture item data from database |

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST | /api/evaluation/save | Saves all furniture item data to the database |

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PUT  | /api/evaluation/:id | Updates furniture item data |

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DELETE | /api/evaluation/:id | Removes furniture item data from database |

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PATCH  | /api/evaluation/:id/status | Updates only the status field of an evaluation. Accepted statuses: "not reviewed", "reviewed", "archived" |


### CRUD operations for list of brands or models selected by an expert in the database

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET  | /api/expertSelectedBrand/all | Gets all expert-selected brands and models |

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST | /api/expertSelectedBrand/add | Adds a new brand or model entry to the expert-selected list |

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PUT  | /api/expertSelectedBrand/update/:id | Updates an existing entry (brand and/or model) by ID |

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DELETE | /api/expertSelectedBrand/delete/:id | Removes an expert-selected entry by ID |

### Authentication

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST  | /api/login | Authenticates a user by username and password and returns a JWT token  |

| HTTP | Route      | Description                                                                                                                                                  |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST | /api/register | Registers a new user account |

| HTTP | Route      | Description                                                           |
| ---- | ---------- | --------------------------------------------------------------------- |
| POST | /api/users/:id/role | Admin-level endpoint to update users role |


### Available routes but not in use in UI

| HTTP | Route         | Description                                                                                                                                           |
| ---- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST | /api/location | Send the user location coordinates and the AI will find locations where the user can perform recycle to the piece of furniture |

| HTTP | Route      | Description                                                           |
| ---- | ---------- | --------------------------------------------------------------------- |
| POST | /api/price | Separates pricing logic from the image parsing flow. Send SerpApi result with brand and model, other furniture details and image in the request body to receive price estimates |


### Requests and Responses

> #### /api/photo
>
> ![api_chat_postman](./screenshots-main/api_photo_postman.png)

> #### /api/image
>
> ![api_image_postman](./screenshots-main/api_image_postman.png)

> #### /api/evaluation/check
>
> ![api_image_postman](./screenshots-main/api_check_postman.png)

> #### /api/expertSelectedBrand
>
> ![api_location_postman](./screenshots-main/api_expertBrandAndModel_postman.png)

> #### /api/price
>
> ![api_price_postman](./screenshots-main/api_price_postman.png)

> #### /api/location
>
> ![api_location_postman](./screenshots-main/api_location_postman.png)


## Docker Instructions

### Using Dockerfile

#### Build Docker Image

To build the Docker image, run the following command in the root directory:

```sh
docker build -t kaluste-backend .
```

#### Run Docker Container

```sh
docker run -d --name kaluste-backend -p 3000:3000 --env-file .env kaluste-backend
```

#### Stop Docker Container

To stop the Docker container, use the following command:

```sh
docker stop kaluste-backend
```

#### Remove Docker Container

To remove the Docker container, use the following command:

```sh
docker rm kaluste-backend
```

### Using Docker Compose

#### docker-compose-be-cache.yml

This file is used to set up and run both the backend and Memcached services.

To build and run the containers, use the following command:

```sh
docker-compose -f docker-compose-be-cache.yml up
```

To stop the running containers, use the following command:

```sh
docker-compose -f docker-compose-be-cache.yml down
```

#### docker-compose-local-cache.yml

This file is used to set up and run only the Memcached service. Note: Remove `MEMCACHED_HOST` from `.env` or set it to `localhost` for this to work.

To build and run the Memcached container, use the following command:

```sh
docker-compose -f docker-compose-local-cache.yml up
```

After the Memcached container is running, run the backend locally:

```sh
npm run dev
```

To stop the running Memcached container, use the following command:

```sh
docker-compose -f docker-compose-local-cache.yml down
```

## Database

This project uses [MongoDB](https://www.mongodb.com/) as its database solution and [mongoose](https://mongoosejs.com/) to interact with MongoDB.

### Main Functionalities

1. Conversation Logging

   - Stores chat interactions between users and AI
   - Endpoint: `/api/chat`
   - Records full conversation history

2. Review Logging
   - Stores user feedback and reviews
   - Endpoint: `/api/review`

### Database Schema

The schema for the database documents is declared in the [log.ts](/src/models/log.ts) file.

## Vision Pipeline

> **Note**: _Last updated: April 25, 2025_

The Vision Pipeline process works as follows:

1. User uploads a furniture image through the Frontend UI
2. Image is sended to AI to check its quality
3. If image is ok, it is processed and sent to SerpApi for brand and model search
4. Next step is AI GPT-4o vision model, which generating all others details
5. Proceed to Price Analysis with all furniture details and image with GPT-4o
6. Present results in editable form exept price for user verification
7. Before saving to DB checking if brand or model is needed in stock, if no need AI will do analysis if it is valuable

## Vision Pipeline Process

This diagram illustrates the Vision Pipeline process for furniture analysis, including the user interaction, AI checks, and database interactions.

```mermaid
flowchart TD
    subgraph User
        A1[Upload furniture image]
    end

    subgraph Frontend
        B1[Send image to backend for quality check]
        B2[If OK, send image to backend for brand/model search]
        B3[Check if brand/model needed in stock in DB]
        B4[Present editable results to user]

    end

    subgraph GPT-4
        C1[Check image quality]
        C2[Generate additional furniture details]

        C4[Price Analysis]
        C5[Analyze if non-needed item is still valuable]
    end

    subgraph SerpApi
        D1[Search brand and model]
    end

    subgraph Database
        
        F2[Save evaluation]
    end

    A1 --> B1
    B1 --> C1
    C1 --> B2
    B2 --> D1
    D1 --> C2
    C4 --> B4
    B4 --> B3
    C2 --> C4
    B3 -->|If no needed| C5
    B3 -->|If needed| F2
    C5 -->|If still valuable| F2


    style A1 fill:#FFDDC1,stroke:#FF5733,stroke-width:2px, color:#333

    style B1 fill:#D1E8E2,stroke:#1ABC9C,stroke-width:2px, color:#333
    style B2 fill:#D1E8E2,stroke:#1ABC9C,stroke-width:2px, color:#333
    style B4 fill:#D1E8E2,stroke:#1ABC9C,stroke-width:2px, color:#333
    style B3 fill:#D1E8E2,stroke:#1ABC9C,stroke-width:2px, color:#333
    style C1 fill:#F1C40F,stroke:#F39C12,stroke-width:2px, color:#333
    style C2 fill:#F1C40F,stroke:#F39C12,stroke-width:2px, color:#333
    style C4 fill:#F1C40F,stroke:#F39C12,stroke-width:2px, color:#333
    style C5 fill:#F1C40F,stroke:#F39C12,stroke-width:2px, color:#333

    style F2 fill:#F1948A,stroke:#E74C3C,stroke-width:2px, color:#333

    style D1 fill:#28B463,stroke:#1F8A44,stroke-width:2px, color:#fff
    
```

## Database Structure (MongoDB)

### 1. `Evaluation`

| Field                         | Type               | Required |
|------------------------------|--------------------|----------|
| `timeStamp`                  | `Date`             | No       |
| `imageId`                    | `ObjectId`         | Yes      |
| `evaluation.brand`           | `String`           | No       |
| `evaluation.model`           | `String`           | No       |
| `evaluation.color`           | `String`           | No       |
| `evaluation.dimensions`      | `Object`           | No       |
| `evaluation.materials`       | `[String]`         | No       |
| `evaluation.condition`       | `String (enum)`    | No       |
| `priceEstimation.suositus_hinta` | `Number`      | No       |
| `priceEstimation.perustelu`  | `[String]`         | No       |
| `user`                       | `Object`           | Yes      |
| `status`                     | `String (enum)`    | No       |
| `description`                | `String`           | No       |

---

### 2. `ExpertSelectedBrand`

| Field    | Type     | Required |
|----------|----------|----------|
| `brand`  | `String` | No       |
| `model`  | `String` | No       |

---

### 3. `Image`

Saved image data after evaluation saving

| Field        | Type      | Required |
|--------------|-----------|----------|
| `contentType`| `String`  | Yes      |
| `image`      | `Buffer`  | Yes      |
| `timeStamp`  | `Date`    | No       |

---

### 4. `tempImage`

Temporary image storage, used before full processing

| Field        | Type     | Required |
|--------------|----------|----------|
| `contentType`| `String` | Yes      |
| `image`      | `Buffer` | Yes      |

---

### 5. `Location`

| Field                      | Type     | Required |
|---------------------------|----------|----------|
| `name`                    | `String` | Yes      |
| `address`                 | `String` | Yes      |
| `type`                    | `String` | No       |
| `gps_coordinates.latitude` | `Number`| Yes      |
| `gps_coordinates.longitude`| `Number`| Yes      |
| `createdAt`               | `Date`   | No       |

---

### 6. `User`

| Field      | Type      | Required |
|------------|-----------|----------|
| `username` | `String`  | Yes      |
| `password` | `String`  | Yes      |
| `email`    | `String`  | Yes      |
| `firstname`| `String`  | Yes      |
| `lastname` | `String`  | Yes      |
| `role`     | `String`  | No       |


## To Developer

### Environment Setup

Remember to set environment variables:

```bash
cp .env.example .env
```

### Rahti Production Environment

Application has been published to Rahti following [this deployment guide](https://github.com/laguagu/arvolaskuri-node-backend?tab=readme-ov-file#sovelluksen-julkaisu-csc-rahti-2ssa-github-integraatiolla).

## Lisenssi

License - katso [LICENSE](LICENSE) tiedosto lisätietoja varten.
