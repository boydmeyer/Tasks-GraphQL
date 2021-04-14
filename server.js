const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const cors = require("cors");
const dotEnv = require("dotenv");
const Dataloader = require("dataloader");

const resolvers = require("./resolvers");
const typeDefs = require("./typeDefs");
const { verifyUser } = require("./helper/context");
const { connection } = require("./database/util");
const loader = require("./loaders");

dotEnv.config();

const app = express();

connection();

app.use(express.json());
app.use(cors());

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, connection }) => {
        const contextObj = {};

        if (req) {
            await verifyUser(req);
            contextObj.user = req.user;
        }

        contextObj.loaders = {
            user: new Dataloader((keys) => loader.user.batchUsers(keys)),
        };

        return contextObj;
    },
    formatError: (error) => {
        console.log(error);
        return {
            message: error.message,
        };
    },
});

apolloServer.applyMiddleware({ app, path: "/graphql" });

const PORT = process.env.PORT || 3000;

app.use("/", (req, res, next) => {
    res.send({ message: "Welcome traveler!" });
});

const httpserver = app.listen(PORT, () => {
    console.log(`Server listening on PORT: ${PORT}`);
    console.log(`GraphQL: http://localhost:${PORT}${apolloServer.graphqlPath}`);
});

apolloServer.installSubscriptionHandlers(httpserver);
