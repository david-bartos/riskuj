type EditableGroup = {
  id: string;
  title: string;
};

type CategoryEditorProps = {
  title: string;
  addLabel: string;
  emptyLabel: string;
  deleteMessage: string;
  groups: EditableGroup[];
  onAdd: () => void;
  onRename: (groupId: string, title: string) => void;
  onRemove: (groupId: string) => void;
};

export default function CategoryEditor({
  title,
  addLabel,
  emptyLabel,
  deleteMessage,
  groups,
  onAdd,
  onRename,
  onRemove
}: CategoryEditorProps) {
  return (
    <section className="editor-section" aria-labelledby={`${title}-heading`}>
      <div className="section-heading-row">
        <h3 id={`${title}-heading`}>{title}</h3>
        <button className="button-compact" type="button" onClick={onAdd}>
          {addLabel}
        </button>
      </div>
      {groups.length === 0 ? <p className="muted-text">{emptyLabel}</p> : null}
      <div className="item-list">
        {groups.map((group) => (
          <div className="field-row" key={group.id}>
            <label className="field-stack">
              <span>Název: {group.title || "bez názvu"}</span>
              <input
                value={group.title}
                onChange={(event) => onRename(group.id, event.target.value)}
              />
            </label>
            <button
              className="danger-button button-compact"
              type="button"
              onClick={() => {
                if (window.confirm(deleteMessage)) {
                  onRemove(group.id);
                }
              }}
            >
              Smazat
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
