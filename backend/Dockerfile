# Use an official Node.js runtime as a parent image (LTS version recommended)
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
# Use wildcard to handle both lock file types if needed, but prefer consistency
COPY package*.json ./

# Install app dependencies
# Use --only=production if you don't need devDependencies in the final image
RUN npm install --only=production

# Bundle app source inside Docker image
COPY . .

# Make port 3001 available to the world outside this container (adjust if you changed the port)
# Cloud Run ignores this EXPOSE instruction but it's good practice
EXPOSE 3001

# Define the command to run your app using CMD which defines your runtime
# Use node directly to start the server
CMD [ "node", "server.js" ]