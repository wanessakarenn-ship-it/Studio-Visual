import type {StudioDocument} from '../schema/v2';
import type {Result} from './index';
// Interim structural-sharing snapshots. Patch history is a separate pending ADR.
type State={document:StudioDocument;selectedId:string|null};
export type Session=State&{past:State[];future:State[];transaction:State|null};
const snapshot=(s:Session):State=>({document:s.document,selectedId:s.selectedId});
export function createSession(document:StudioDocument):Session{return {document,selectedId:null,past:[],future:[],transaction:null};}
export function beginTransaction(s:Session):Session{return s.transaction?s:{...s,transaction:snapshot(s)};}
export function applyResult(s:Session,r:Result):Session{
 if(!r.ok||r.document===s.document)return s;
 return {...s,document:r.document,selectedId:r.selectedId??s.selectedId,past:s.transaction?s.past:[...s.past.slice(-99),snapshot(s)],future:s.transaction?s.future:[]};
}
export function commitTransaction(s:Session):Session{
 if(!s.transaction)return s;
 return s.transaction.document===s.document?{...s,transaction:null}:{...s,past:[...s.past.slice(-99),s.transaction],future:[],transaction:null};
}
export function cancelTransaction(s:Session):Session{return s.transaction?{...s,...s.transaction,transaction:null}:s;}
export function undo(s:Session):Session{
 if(s.transaction)return s;const old=s.past.at(-1);return old?{...s,...old,past:s.past.slice(0,-1),future:[snapshot(s),...s.future]}:s;
}
export function redo(s:Session):Session{
 if(s.transaction)return s;const next=s.future[0];return next?{...s,...next,past:[...s.past.slice(-99),snapshot(s)],future:s.future.slice(1)}:s;
}
