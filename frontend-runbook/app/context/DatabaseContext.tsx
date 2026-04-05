'use client';

import { createContext, useState, ReactNode } from 'react';

type DatabaseContextType = {
  database: string;
  setDatabase: (db: string) => void;
  currentNode: string | null;
  setCurrentNode: (nodeId: string | null) => void;
};

const DatabaseContext = createContext<DatabaseContextType>({
  database: "",
  setDatabase: () => { },
  currentNode: null,
  setCurrentNode: () => { },
});

const DatabaseProvider = ({ children }: { children: ReactNode }) => {

  const [database, setDatabase] = useState<string>("");
  const [currentNode, setCurrentNode] = useState<string | null>(null);

  return (
    <DatabaseContext.Provider
      value={{
        database,
        setDatabase,
        currentNode,
        setCurrentNode
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export { DatabaseContext, DatabaseProvider };
