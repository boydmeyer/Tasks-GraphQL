const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PubSub = require("../subscription");
const { userEvents } = require("../subscription/events");
const { combineResolvers } = require("graphql-resolvers");
const { isAuthenticated } = require("./middleware");

const User = require("../database/models/user");
const Task = require("../database/models/task");

module.exports = {
    Query: {
        user: combineResolvers(isAuthenticated, async (_, __, { user }) => {
            const existingUser = await User.findOne({ _id: user.id });
            if (!existingUser) throw new Error("User not found!");

            return existingUser;
        }),
    },
    Mutation: {
        signup: async (_, { input }) => {
            try {
                const emailExists = await User.findOne({ email: input.email });
                if (emailExists) throw new Error("E-mail already in use.");

                const nameExists = await User.findOne({ name: input.name });
                if (nameExists) throw new Error("Name already in use.");

                const hashedPassword = await bcrypt.hash(input.password, 12);

                const newUser = new User({
                    ...input,
                    password: hashedPassword,
                });
                const result = await newUser.save();
                PubSub.publish(userEvents.USER_CREATED, {
                    userCreated: result,
                });
                return result;
            } catch (error) {
                throw error;
            }
        },
        login: async (_, { input }) => {
            try {
                const user = await User.findOne({ email: input.email });
                if (!user) {
                    throw new Error("Credentials invalid");
                }

                const isPasswordValid = await bcrypt.compare(
                    input.password,
                    user.password
                );
                if (!isPasswordValid) {
                    throw new Error("Credentials invalid");
                }

                const token = jwt.sign(
                    { id: user.id, email: user.email },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: "1d" }
                );
                return { token };
            } catch (error) {
                throw error;
            }
        },
    },
    Subscription: {
        userCreated: {
            subscribe: () => PubSub.asyncIterator(userEvents.USER_CREATED),
        },
    },
    User: {
        tasks: async ({ id }) => {
            try {
                const tasks = await Task.find({ user: id });
                return tasks;
            } catch (error) {
                throw error;
            }
        },
    },
};
