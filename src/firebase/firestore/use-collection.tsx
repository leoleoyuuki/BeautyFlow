
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  query as firestoreQuery,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
  loadMore: () => void;
  hasMore: boolean;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

export function useCollection<T = any>(
  baseQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
  pageSize: number = 15
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  
  const queryRef = useRef(baseQuery);
  queryRef.current = baseQuery;

  const fetchData = useCallback(async (isLoadMore = false) => {
    if (!queryRef.current) {
        setData(null);
        setIsLoading(false);
        setError(null);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        let q = firestoreQuery(queryRef.current, limit(pageSize));
        if (isLoadMore && lastDoc) {
            q = firestoreQuery(queryRef.current, startAfter(lastDoc), limit(pageSize));
        }
        
        const snapshot = await getDocs(q);
        
        const results: ResultItemType[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        
        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        setLastDoc(newLastDoc);
        setHasMore(snapshot.docs.length === pageSize);

        setData(prevData => isLoadMore ? [...(prevData || []), ...results] : results);

    } catch (e) {
      const err = e as FirestoreError;
      const path: string = queryRef.current.type === 'collection'
          ? (queryRef.current as CollectionReference).path
          : (queryRef.current as unknown as InternalQuery)._query.path.canonicalString();

      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path,
      });

      setError(contextualError);
      setData(null);
      errorEmitter.emit('permission-error', contextualError);
    } finally {
        setIsLoading(false);
    }
  }, [pageSize, lastDoc]);

  useEffect(() => {
    // Reset state when the base query changes
    setData(null);
    setLastDoc(null);
    setHasMore(true);
    fetchData(false);
  }, [baseQuery]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchData(true);
    }
  }, [hasMore, isLoading, fetchData]);

  if(baseQuery && !baseQuery.__memo) {
    throw new Error('useCollection query was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error, loadMore, hasMore };
}
