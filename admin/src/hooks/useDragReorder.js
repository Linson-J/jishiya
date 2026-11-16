import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../api/axiosInstance';

/**
 * Drag-and-drop (and button) reordering for a list of items that carry a
 * numeric `sort_order`.
 *
 *  items    — current list, already sorted
 *  setItems — state setter for that list
 *  persist  — async (changes: [{ id, sort_order }]) => void; rejects on failure
 *
 * The UI updates optimistically and rolls back if `persist` fails.
 */
export default function useDragReorder({ items, setItems, persist }) {
  const dragFrom = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const move = useCallback(
    async (from, to) => {
      if (from === null || from === to || to < 0 || to >= items.length) return;

      const previous = items;
      const reordered = [...items];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      const renumbered = reordered.map((item, i) => ({ ...item, sort_order: i + 1 }));

      const changes = renumbered
        .filter((item) => {
          const old = previous.find((p) => p.id === item.id);
          return !old || old.sort_order !== item.sort_order;
        })
        .map((item) => ({ id: item.id, sort_order: item.sort_order }));

      setItems(renumbered);
      if (changes.length === 0) return;

      try {
        await persist(changes);
        toast.success('Order saved');
      } catch (err) {
        setItems(previous);
        toast.error(getErrorMessage(err, 'Could not save the new order'));
      }
    },
    [items, setItems, persist]
  );

  const clear = () => {
    dragFrom.current = null;
    setDragging(null);
    setOverIndex(null);
  };

  const getRowProps = (index) => ({
    draggable: true,
    onDragStart: (e) => {
      dragFrom.current = index;
      setDragging(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (overIndex !== index) setOverIndex(index);
    },
    onDrop: (e) => {
      e.preventDefault();
      const from = dragFrom.current;
      clear();
      move(from, index);
    },
    onDragEnd: clear,
  });

  return { getRowProps, move, dragging, overIndex };
}
