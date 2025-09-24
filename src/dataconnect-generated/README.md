# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyTaskLists*](#getmytasklists)
- [**Mutations**](#mutations)
  - [*CreateTaskList*](#createtasklist)
  - [*CreateTask*](#createtask)
  - [*UpdateTaskIsCompleted*](#updatetaskiscompleted)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyTaskLists
You can execute the `GetMyTaskLists` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyTaskLists(): QueryPromise<GetMyTaskListsData, undefined>;

interface GetMyTaskListsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyTaskListsData, undefined>;
}
export const getMyTaskListsRef: GetMyTaskListsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyTaskLists(dc: DataConnect): QueryPromise<GetMyTaskListsData, undefined>;

interface GetMyTaskListsRef {
  ...
  (dc: DataConnect): QueryRef<GetMyTaskListsData, undefined>;
}
export const getMyTaskListsRef: GetMyTaskListsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyTaskListsRef:
```typescript
const name = getMyTaskListsRef.operationName;
console.log(name);
```

### Variables
The `GetMyTaskLists` query has no variables.
### Return Type
Recall that executing the `GetMyTaskLists` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyTaskListsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyTaskListsData {
  taskLists: ({
    id: UUIDString;
    name: string;
    createdAt: TimestampString;
  } & TaskList_Key)[];
}
```
### Using `GetMyTaskLists`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyTaskLists } from '@dataconnect/generated';


// Call the `getMyTaskLists()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyTaskLists();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyTaskLists(dataConnect);

console.log(data.taskLists);

// Or, you can use the `Promise` API.
getMyTaskLists().then((response) => {
  const data = response.data;
  console.log(data.taskLists);
});
```

### Using `GetMyTaskLists`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyTaskListsRef } from '@dataconnect/generated';


// Call the `getMyTaskListsRef()` function to get a reference to the query.
const ref = getMyTaskListsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyTaskListsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.taskLists);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.taskLists);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateTaskList
You can execute the `CreateTaskList` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createTaskList(): MutationPromise<CreateTaskListData, undefined>;

interface CreateTaskListRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateTaskListData, undefined>;
}
export const createTaskListRef: CreateTaskListRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createTaskList(dc: DataConnect): MutationPromise<CreateTaskListData, undefined>;

interface CreateTaskListRef {
  ...
  (dc: DataConnect): MutationRef<CreateTaskListData, undefined>;
}
export const createTaskListRef: CreateTaskListRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createTaskListRef:
```typescript
const name = createTaskListRef.operationName;
console.log(name);
```

### Variables
The `CreateTaskList` mutation has no variables.
### Return Type
Recall that executing the `CreateTaskList` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateTaskListData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateTaskListData {
  taskList_insert: TaskList_Key;
}
```
### Using `CreateTaskList`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createTaskList } from '@dataconnect/generated';


// Call the `createTaskList()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createTaskList();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createTaskList(dataConnect);

console.log(data.taskList_insert);

// Or, you can use the `Promise` API.
createTaskList().then((response) => {
  const data = response.data;
  console.log(data.taskList_insert);
});
```

### Using `CreateTaskList`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createTaskListRef } from '@dataconnect/generated';


// Call the `createTaskListRef()` function to get a reference to the mutation.
const ref = createTaskListRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createTaskListRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.taskList_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.taskList_insert);
});
```

## CreateTask
You can execute the `CreateTask` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createTask(vars: CreateTaskVariables): MutationPromise<CreateTaskData, CreateTaskVariables>;

interface CreateTaskRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTaskVariables): MutationRef<CreateTaskData, CreateTaskVariables>;
}
export const createTaskRef: CreateTaskRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createTask(dc: DataConnect, vars: CreateTaskVariables): MutationPromise<CreateTaskData, CreateTaskVariables>;

interface CreateTaskRef {
  ...
  (dc: DataConnect, vars: CreateTaskVariables): MutationRef<CreateTaskData, CreateTaskVariables>;
}
export const createTaskRef: CreateTaskRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createTaskRef:
```typescript
const name = createTaskRef.operationName;
console.log(name);
```

### Variables
The `CreateTask` mutation requires an argument of type `CreateTaskVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateTaskVariables {
  taskListId: UUIDString;
  description: string;
  dueDate?: DateString | null;
}
```
### Return Type
Recall that executing the `CreateTask` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateTaskData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateTaskData {
  task_insert: Task_Key;
}
```
### Using `CreateTask`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createTask, CreateTaskVariables } from '@dataconnect/generated';

// The `CreateTask` mutation requires an argument of type `CreateTaskVariables`:
const createTaskVars: CreateTaskVariables = {
  taskListId: ..., 
  description: ..., 
  dueDate: ..., // optional
};

// Call the `createTask()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createTask(createTaskVars);
// Variables can be defined inline as well.
const { data } = await createTask({ taskListId: ..., description: ..., dueDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createTask(dataConnect, createTaskVars);

console.log(data.task_insert);

// Or, you can use the `Promise` API.
createTask(createTaskVars).then((response) => {
  const data = response.data;
  console.log(data.task_insert);
});
```

### Using `CreateTask`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createTaskRef, CreateTaskVariables } from '@dataconnect/generated';

// The `CreateTask` mutation requires an argument of type `CreateTaskVariables`:
const createTaskVars: CreateTaskVariables = {
  taskListId: ..., 
  description: ..., 
  dueDate: ..., // optional
};

// Call the `createTaskRef()` function to get a reference to the mutation.
const ref = createTaskRef(createTaskVars);
// Variables can be defined inline as well.
const ref = createTaskRef({ taskListId: ..., description: ..., dueDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createTaskRef(dataConnect, createTaskVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.task_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.task_insert);
});
```

## UpdateTaskIsCompleted
You can execute the `UpdateTaskIsCompleted` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateTaskIsCompleted(vars: UpdateTaskIsCompletedVariables): MutationPromise<UpdateTaskIsCompletedData, UpdateTaskIsCompletedVariables>;

interface UpdateTaskIsCompletedRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTaskIsCompletedVariables): MutationRef<UpdateTaskIsCompletedData, UpdateTaskIsCompletedVariables>;
}
export const updateTaskIsCompletedRef: UpdateTaskIsCompletedRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateTaskIsCompleted(dc: DataConnect, vars: UpdateTaskIsCompletedVariables): MutationPromise<UpdateTaskIsCompletedData, UpdateTaskIsCompletedVariables>;

interface UpdateTaskIsCompletedRef {
  ...
  (dc: DataConnect, vars: UpdateTaskIsCompletedVariables): MutationRef<UpdateTaskIsCompletedData, UpdateTaskIsCompletedVariables>;
}
export const updateTaskIsCompletedRef: UpdateTaskIsCompletedRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateTaskIsCompletedRef:
```typescript
const name = updateTaskIsCompletedRef.operationName;
console.log(name);
```

### Variables
The `UpdateTaskIsCompleted` mutation requires an argument of type `UpdateTaskIsCompletedVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateTaskIsCompletedVariables {
  id: UUIDString;
  isCompleted: boolean;
}
```
### Return Type
Recall that executing the `UpdateTaskIsCompleted` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateTaskIsCompletedData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateTaskIsCompletedData {
  task_update?: Task_Key | null;
}
```
### Using `UpdateTaskIsCompleted`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateTaskIsCompleted, UpdateTaskIsCompletedVariables } from '@dataconnect/generated';

// The `UpdateTaskIsCompleted` mutation requires an argument of type `UpdateTaskIsCompletedVariables`:
const updateTaskIsCompletedVars: UpdateTaskIsCompletedVariables = {
  id: ..., 
  isCompleted: ..., 
};

// Call the `updateTaskIsCompleted()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateTaskIsCompleted(updateTaskIsCompletedVars);
// Variables can be defined inline as well.
const { data } = await updateTaskIsCompleted({ id: ..., isCompleted: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateTaskIsCompleted(dataConnect, updateTaskIsCompletedVars);

console.log(data.task_update);

// Or, you can use the `Promise` API.
updateTaskIsCompleted(updateTaskIsCompletedVars).then((response) => {
  const data = response.data;
  console.log(data.task_update);
});
```

### Using `UpdateTaskIsCompleted`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateTaskIsCompletedRef, UpdateTaskIsCompletedVariables } from '@dataconnect/generated';

// The `UpdateTaskIsCompleted` mutation requires an argument of type `UpdateTaskIsCompletedVariables`:
const updateTaskIsCompletedVars: UpdateTaskIsCompletedVariables = {
  id: ..., 
  isCompleted: ..., 
};

// Call the `updateTaskIsCompletedRef()` function to get a reference to the mutation.
const ref = updateTaskIsCompletedRef(updateTaskIsCompletedVars);
// Variables can be defined inline as well.
const ref = updateTaskIsCompletedRef({ id: ..., isCompleted: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateTaskIsCompletedRef(dataConnect, updateTaskIsCompletedVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.task_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.task_update);
});
```

