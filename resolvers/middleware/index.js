const { skip } = require("graphql-resolvers");
const { Error } = require("mongoose");
const Task = require("../../database/models/task");
const { isValidObjectId } = require("../../database/util");

module.exports.isAuthenticated = (_, __, user) => {
    if (!user) {
        throw new Error("Access Denied, No authentication token found.");
    }
    return skip;
};

module.exports.isTaskOwner = async (_, { id }, { user }) => {
    try {
        if (!isValidObjectId(id)) throw new Error("Invalid id");

        const task = await Task.findById(id);
        if (!task) {
            throw new Error("Task not found.");
        } else if (task.user.toString() !== user.id) {
            throw new Error("Task not found.");
        }
        return skip;
    } catch (error) {
        throw error;
    }
};
