FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Emme kopioi koodia tässä, se tulee volume mountin kautta
# COPY . .

# Varmistetaan, että nodemon tarkkailee tiedostomuutoksia
CMD ["npm", "run", "dev"]