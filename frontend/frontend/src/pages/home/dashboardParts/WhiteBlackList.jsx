import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthService";

export default function WhiteBlackList({ agentId, listType }) {

    const { authFetch } = useAuth();

    const [list, setList] = useState([]);
    const [editingIntegration, setEditingIntegration] = useState(false);
    const [editedList, setEditedList] = useState([]);

    const WhitelistScope = {
        GROUP: 'GROUP',
        CONTACT: 'CONTACT',
        ALL: 'ALL'
    };

    const callToGetList = async () => {
        const response = await authFetch(`/agent/permission-list?agentId=${agentId}&listType=${listType}`);

        if (response?.ok) {
            const data = await response.json();
            setList(data);
        }
    }

    useEffect(() => {
        callToGetList();
    }, []);

    const startEditingIntegration = async () => {
        setEditingIntegration(true);
        setEditedList([...list]);
        console.log("editing");
    }

    const handleSaveIntegration = async () => {
        setEditingIntegration(false);

        const changes = detectChanges(list, editedList);
        console.log("Changes detected:", changes);

        console.log(listType);

        const addedPromises = changes.added.map(async entry => {
            console.log("Entry to add ", entry);

            const bodyParams = {
                agentId,
                listType,
                scope: entry.scope,
                identifier: entry.identifier
            }

            const response = await authFetch(`/agent/permission-list`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyParams)
            });

            if (response.ok) {
                const data = await response.json();

                console.log("Successfully added a new entry to list.");
            }
            else {
                console.log("There was an error adding to list");
            }
        });

        const updatePromises = changes.updated.map(async entry => {
            console.log("Entry to update ", entry);

            const bodyParams = {
                entryId: entry.id,
                listType,
            }

            if (entry.original.scope !== entry.updated.scope) {
                bodyParams.scope = entry.updated.scope;
            }

            if (entry.original.identifier !== entry.updated.identifier) {
                bodyParams.identifier = entry.updated.identifier;
            }

            console.log(bodyParams);

            const response = await authFetch(`/agent/permission-list`, {
                method: "PATCH",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyParams)
            });

            if (response.ok) {
                const data = await response.json();

                console.log("Successfully updated a entry from the list.");
            }
            else {
                console.log("There was an error updating an entry to the list");
            }

        });

        const deletePromises = changes.removed.map(async entry => {
            console.log("Entry to delete ", entry);

            const bodyParams = {
                entryId: entry.id,
                listType
            }

            console.log(bodyParams);

            const response = await authFetch(`/agent/permission-list`, {
                method: "DELETE",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyParams)
            });

            if (response.ok) {
                const data = await response.json();

                console.log("Successfully deleted the entry from the list.");
            }
            else {
                console.log("There was an error deleting the list");
            }
        });

        await Promise.all([...addedPromises, ...updatePromises, ...deletePromises]);

        await callToGetList();
        console.log("saving");
    }

    const cancelEditIntegration = async () => {
        setEditingIntegration(false);
        setEditedList([]);
    }

    const detectChanges = (original, edited) => {
        const changes = {
            added: [],
            updated: [],
            removed: []
        };

        edited.forEach(editedItem => {
            const originalItem = original.find(item => item.id === editedItem.id);
            if (!originalItem) {
                changes.added.push(editedItem);
            } else if (originalItem.scope !== editedItem.scope || originalItem.identifier !== editedItem.identifier) {
                changes.updated.push({
                    id: editedItem.id,
                    original: originalItem,
                    updated: editedItem
                });
            }
        });

        original.forEach(originalItem => {
            const editedItem = edited.find(item => item.id === originalItem.id);
            if (!editedItem) {
                changes.removed.push(originalItem);
            }
        });

        return changes;
    };

    const addNewEntry = () => {
        const newEntry = {
            id: `temp-${Date.now()}`,
            agentId: agentId,
            scope: 'CONTACT',
            identifier: ''
        };
        setEditedList([...editedList, newEntry]);
    };

    const removeEntry = (entryId) => {
        setEditedList(editedList.filter(item => item.id !== entryId));
    };

    const updateEntry = (entryId, field, value) => {
        setEditedList(editedList.map(item =>
            item.id === entryId ? { ...item, [field]: value } : item
        ));
    };

    const currentList = editingIntegration ? editedList : list;

    return (
        <>
            <link rel="stylesheet" href="/AgentDetail.css" />

            <div className="integration-card">
                <div className="card-header">
                    <h3 className="integration-title">
                        <img
                            className="integration-icon"
                            src={listType === 'whitelist' ? '/whitelist.svg' : '/blacklist.svg'}
                            alt={`${listType === 'whitelist' ? 'Whitelist' : 'Blacklist'} icon`}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/jmrlogo.png' }}
                        />
                        <span>{listType === 'whitelist' ? "Whitelist" : "Blacklist"}</span>
                    </h3>
                    <div className="card-actions">
                        {!editingIntegration && (
                            <button className="edit-btn" onClick={startEditingIntegration}>
                                ⚙️
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-content">
                    {currentList.length > 0 ? (
                        <div className="field-group">
                            {currentList.map((item) => (
                                <div key={item.id} className="api-key-item">
                                    {editingIntegration ? (
                                        <>
                                            <select
                                                value={item.scope}
                                                onChange={(e) => updateEntry(item.id, 'scope', e.target.value)}
                                                className="scope-select"
                                            >
                                                {Object.values(WhitelistScope).map(scope => (
                                                    <option key={scope} value={scope}>
                                                        {scope}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={item.identifier}
                                                onChange={(e) => updateEntry(item.id, 'identifier', e.target.value)}
                                                className="key-input"
                                                placeholder="Enter identifier..."
                                            />
                                            <button
                                                className="remove-btn"
                                                onClick={() => removeEntry(item.id)}
                                            >
                                                ❌
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="key-name">{item.scope}</span>
                                            <span className="key-preview">{item.identifier}</span>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            No entries in {listType === 'whitelist' ? 'whitelist' : 'blacklist'}
                        </div>
                    )}

                    {editingIntegration && (
                        <div className="add-entry-section">
                            <button className="add-btn" onClick={addNewEntry}>
                                + Add Entry
                            </button>
                        </div>
                    )}
                </div>

                {editingIntegration && (
                    <div className="card-footer">
                        <button className="save-btn" onClick={handleSaveIntegration}>
                            Save
                        </button>
                        <button className="cancel-btn" onClick={cancelEditIntegration}>
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </>
    );

}