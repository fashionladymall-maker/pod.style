const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'my-firebase-app',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createTaskListRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateTaskList');
}
createTaskListRef.operationName = 'CreateTaskList';
exports.createTaskListRef = createTaskListRef;

exports.createTaskList = function createTaskList(dc) {
  return executeMutation(createTaskListRef(dc));
};

const getMyTaskListsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyTaskLists');
}
getMyTaskListsRef.operationName = 'GetMyTaskLists';
exports.getMyTaskListsRef = getMyTaskListsRef;

exports.getMyTaskLists = function getMyTaskLists(dc) {
  return executeQuery(getMyTaskListsRef(dc));
};

const createTaskRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateTask', inputVars);
}
createTaskRef.operationName = 'CreateTask';
exports.createTaskRef = createTaskRef;

exports.createTask = function createTask(dcOrVars, vars) {
  return executeMutation(createTaskRef(dcOrVars, vars));
};

const updateTaskIsCompletedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateTaskIsCompleted', inputVars);
}
updateTaskIsCompletedRef.operationName = 'UpdateTaskIsCompleted';
exports.updateTaskIsCompletedRef = updateTaskIsCompletedRef;

exports.updateTaskIsCompleted = function updateTaskIsCompleted(dcOrVars, vars) {
  return executeMutation(updateTaskIsCompletedRef(dcOrVars, vars));
};
