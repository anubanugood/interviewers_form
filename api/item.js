const { CONFIG, loadMainItem, loadTasks, splitRejection } = require('./_monday');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const itemId = String((req.query && (req.query.itemId || req.query.item_id || req.query.id)) || '').trim();

  if (!/^\d+$/.test(itemId)) {
    return res.status(400).json({ error: 'יש להוסיף לקישור ?itemId= ואחריו מספר הפריט ב־monday.' });
  }

  try {
    const item = await loadMainItem(itemId);
    if (!item) {
      return res.status(404).json({ error: `הפריט ${itemId} לא נמצא בטבלת המתנדבים הראשית.` });
    }
    const tasks = await loadTasks(item.linkedTaskIds);
    const c = CONFIG.columns;
    const rejection = splitRejection(item.fields.interviewerNotes);

    return res.status(200).json({
      item: { id: item.id, name: item.name, boardId: item.boardId },
      fields: { ...item.fields, interviewerNotes: rejection.notes, rejected: rejection.rejected, rejectionDetails: rejection.details },
      tasks,
      meta: {
        titles: {
          interviewerNotes: c.interviewerNotes.title,
          meetingSummary: c.meetingSummary.title,
          status: c.status.title,
          garin: c.garin.title,
        },
        statusOptions: c.status.options,
        garinOptions: c.garin.options,
        rejectionQuestion: CONFIG.rejectionQuestion,
        taskStatuses: Object.entries(CONFIG.taskStatusColors).map(([label, color]) => ({ label, color })),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'לא ניתן לטעון את הפריט מ־monday.com: ' + err.message });
  }
};
