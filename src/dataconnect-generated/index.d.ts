import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateTaskData {
  task_insert: Task_Key;
}

export interface CreateTaskListData {
  taskList_insert: TaskList_Key;
}

export interface CreateTaskVariables {
  taskListId: UUIDString;
  description: string;
  dueDate?: DateString | null;
}

export interface GetMyTaskListsData {
  taskLists: ({
    id: UUIDString;
    name: string;
    createdAt: TimestampString;
  } & TaskList_Key)[];
}

export interface TaskList_Key {
  id: UUIDString;
  __typename?: 'TaskList_Key';
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface UpdateTaskIsCompletedData {
  task_update?: Task_Key | null;
}

export interface UpdateTaskIsCompletedVariables {
  id: UUIDString;
  isCompleted: boolean;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateTaskListRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateTaskListData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateTaskListData, undefined>;
  operationName: string;
}
export const createTaskListRef: CreateTaskListRef;

export function createTaskList(): MutationPromise<CreateTaskListData, undefined>;
export function createTaskList(dc: DataConnect): MutationPromise<CreateTaskListData, undefined>;

interface GetMyTaskListsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyTaskListsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyTaskListsData, undefined>;
  operationName: string;
}
export const getMyTaskListsRef: GetMyTaskListsRef;

export function getMyTaskLists(): QueryPromise<GetMyTaskListsData, undefined>;
export function getMyTaskLists(dc: DataConnect): QueryPromise<GetMyTaskListsData, undefined>;

interface CreateTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTaskVariables): MutationRef<CreateTaskData, CreateTaskVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTaskVariables): MutationRef<CreateTaskData, CreateTaskVariables>;
  operationName: string;
}
export const createTaskRef: CreateTaskRef;

export function createTask(vars: CreateTaskVariables): MutationPromise<CreateTaskData, CreateTaskVariables>;
export function createTask(dc: DataConnect, vars: CreateTaskVariables): MutationPromise<CreateTaskData, CreateTaskVariables>;

interface UpdateTaskIsCompletedRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTaskIsCompletedVariables): MutationRef<UpdateTaskIsCompletedData, UpdateTaskIsCompletedVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateTaskIsCompletedVariables): MutationRef<UpdateTaskIsCompletedData, UpdateTaskIsCompletedVariables>;
  operationName: string;
}
export const updateTaskIsCompletedRef: UpdateTaskIsCompletedRef;

export function updateTaskIsCompleted(vars: UpdateTaskIsCompletedVariables): MutationPromise<UpdateTaskIsCompletedData, UpdateTaskIsCompletedVariables>;
export function updateTaskIsCompleted(dc: DataConnect, vars: UpdateTaskIsCompletedVariables): MutationPromise<UpdateTaskIsCompletedData, UpdateTaskIsCompletedVariables>;

