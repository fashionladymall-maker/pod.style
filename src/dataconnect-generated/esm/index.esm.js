import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'my-firebase-app',
  location: 'us-east4'
};

export const createTaskListRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateTaskList');
}
createTaskListRef.operationName = 'CreateTaskList';

export function createTaskList(dc) {
  return executeMutation(createTaskListRef(dc));
}

export const getMyTaskListsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyTaskLists');
}
getMyTaskListsRef.operationName = 'GetMyTaskLists';

export function getMyTaskLists(dc) {
  return executeQuery(getMyTaskListsRef(dc));
}

export const createTaskRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateTask', inputVars);
}
createTaskRef.operationName = 'CreateTask';

export function createTask(dcOrVars, vars) {
  return executeMutation(createTaskRef(dcOrVars, vars));
}

export const updateTaskIsCompletedRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateTaskIsCompleted', inputVars);
}
updateTaskIsCompletedRef.operationName = 'UpdateTaskIsCompleted';

export function updateTaskIsCompleted(dcOrVars, vars) {
  return executeMutation(updateTaskIsCompletedRef(dcOrVars, vars));
}

