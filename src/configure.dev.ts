import {
  forwardToMain,
  forwardToRenderer,
  replayActionMain,
  replayActionRenderer,
  triggerAlias,
} from 'electron-redux';
import { applyMiddleware, compose, createStore, Middleware, Store } from 'redux';
import { createLogger } from 'redux-logger';
import promiseMiddleware from 'redux-promise-middleware';
import { RootState } from './root/root.model';
import { rootReducer } from './root/root.reducer';
import { StoreConfig } from './store.model';

declare global {
  interface Window {
    process?: any;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

// Sets up a Chrome extension for time travel debugging.
// See https://github.com/zalmoxisus/redux-devtools-extension for more information.
const devCompose: typeof compose = window && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const enableReducerHotReload = (store: Store<RootState>) => {
  if (module.hot) {
    module.hot.accept('./root/root.reducer', () => store.replaceReducer(rootReducer));
  }

  return store;
};

const getMiddlewares = (scope: 'main' | 'renderer'): Middleware[] => {
  const baseMiddlewares = [
    promiseMiddleware,
  ];
  return scope === 'main' ? [
    triggerAlias,
    ...baseMiddlewares,
    forwardToRenderer,
  ] : [
    forwardToMain,
    ...baseMiddlewares,
    createLogger({
      level: 'info',
      collapsed: true,
    }),
  ];
};

const replayAction = (scope: 'main' | 'renderer', store: Store<RootState>): void => {
  return scope === 'main' ? replayActionMain(store) : replayActionRenderer(store);
};

export const configure = (
  scope: 'main' | 'renderer',
  { initialState }: StoreConfig,
): Store<RootState> => {
  const middlewares = getMiddlewares(scope);
  const enhancer = devCompose(applyMiddleware(...middlewares));

  const store = createStore(rootReducer, initialState, enhancer);

  replayAction(
    scope,
    module.hot ? enableReducerHotReload(store) : store,
  );

  return store;
};
