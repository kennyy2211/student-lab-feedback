
const STORAGE_KEY = "studentLabFeedbackRecords";

const form = document.getElementById("feedbackForm");
const studentNameInput = document.getElementById("studentName");
const rollNumberInput = document.getElementById("rollNumber");
const labNameInput = document.getElementById("labName");
const feedbackTextInput = document.getElementById("feedbackText");

const tableBody = document.getElementById("feedbackTableBody");
const totalCount = document.getElementById("totalCount");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const statusMessage = document.getElementById("statusMessage");
const formTitle = document.getElementById("formTitle");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");

let feedbackRecords = loadRecords();
let editingId = null;
let messageTimeout;

function loadRecords() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return [];
    }

    const parsedData = JSON.parse(savedData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData.filter((record) =>
      record &&
      typeof record.id === "string" &&
      typeof record.studentName === "string" &&
      typeof record.rollNumber === "string" &&
      typeof record.labName === "string" &&
      typeof record.feedbackText === "string"
    );
  } catch (error) {
    console.error("Could not load feedback records:", error);
    return [];
  }
}

function saveRecords() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(feedbackRecords)
    );
    return true;
  } catch (error) {
    console.error("Could not save feedback records:", error);
    showMessage(
      "Could not save records. Check your browser storage settings.",
      "error"
    );
    return false;
  }
}

function showMessage(message, type) {
  clearTimeout(messageTimeout);
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;

  messageTimeout = setTimeout(() => {
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
  }, 4000);
}

function resetForm() {
  form.reset();
  editingId = null;
  formTitle.textContent = "Add New Feedback";
  submitButton.textContent = "Add Feedback";
  cancelButton.hidden = true;
}

function renderRecords() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  const filteredRecords = feedbackRecords.filter((record) =>
    record.studentName.toLowerCase().includes(searchTerm) ||
    record.rollNumber.toLowerCase().includes(searchTerm)
  );

  tableBody.replaceChildren();

  filteredRecords.forEach((record) => {
    const row = document.createElement("tr");

    const studentCell = document.createElement("td");
    studentCell.textContent = record.studentName;

    const rollCell = document.createElement("td");
    rollCell.textContent = record.rollNumber;

    const labCell = document.createElement("td");
    labCell.textContent = record.labName;

    const feedbackCell = document.createElement("td");
    feedbackCell.textContent = record.feedbackText;

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "action-buttons";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "btn btn-small btn-edit";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editRecord(record.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-small btn-delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteRecord(record.id));

    actions.append(editButton, deleteButton);
    actionsCell.append(actions);

    row.append(
      studentCell,
      rollCell,
      labCell,
      feedbackCell,
      actionsCell
    );

    tableBody.append(row);
  });

  totalCount.textContent = feedbackRecords.length;

  emptyMessage.textContent = feedbackRecords.length === 0
    ? "No feedback records yet. Add your first record above."
    : "No matching feedback records found.";

  emptyMessage.hidden = filteredRecords.length > 0;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const studentName = studentNameInput.value.trim();
  const rollNumber = rollNumberInput.value.trim();
  const labName = labNameInput.value.trim();
  const feedbackText = feedbackTextInput.value.trim();

  if (!studentName || !rollNumber || !labName || !feedbackText) {
    showMessage("Please fill in all fields.", "error");
    return;
  }

  if (editingId !== null) {
    const recordIndex = feedbackRecords.findIndex(
      (record) => record.id === editingId
    );

    if (recordIndex === -1) {
      showMessage("This record could not be found.", "error");
      resetForm();
      return;
    }

    const updatedRecord = {
      ...feedbackRecords[recordIndex],
      studentName,
      rollNumber,
      labName,
      feedbackText
    };

    feedbackRecords[recordIndex] = updatedRecord;

    if (!saveRecords()) {
      feedbackRecords[recordIndex] = {
        ...feedbackRecords[recordIndex],
        ...updatedRecord
      };
      return;
    }

    resetForm();
    renderRecords();
    showMessage("Feedback updated successfully!", "success");
  } else {
    const newRecord = {
      id: createId(),
      studentName,
      rollNumber,
      labName,
      feedbackText
    };

    feedbackRecords.unshift(newRecord);

    if (!saveRecords()) {
      feedbackRecords.shift();
      return;
    }

    resetForm();
    renderRecords();
    showMessage("Feedback added successfully!", "success");
  }
});

function createId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function editRecord(id) {
  const record = feedbackRecords.find((item) => item.id === id);

  if (!record) {
    showMessage("Feedback record not found.", "error");
    return;
  }

  editingId = id;
  studentNameInput.value = record.studentName;
  rollNumberInput.value = record.rollNumber;
  labNameInput.value = record.labName;
  feedbackTextInput.value = record.feedbackText;

  formTitle.textContent = "Edit Feedback";
  submitButton.textContent = "Save Changes";
  cancelButton.hidden = false;

  form.scrollIntoView({ behavior: "smooth", block: "start" });
  studentNameInput.focus();
}

function deleteRecord(id) {
  const record = feedbackRecords.find((item) => item.id === id);

  if (!record) {
    showMessage("Feedback record not found.", "error");
    return;
  }

  const confirmed = confirm(
    `Delete feedback from ${record.studentName} (${record.rollNumber})?`
  );

  if (!confirmed) {
    return;
  }

  const previousRecords = feedbackRecords;
  feedbackRecords = feedbackRecords.filter((item) => item.id !== id);

  if (!saveRecords()) {
    feedbackRecords = previousRecords;
    renderRecords();
    return;
  }

  if (editingId === id) {
    resetForm();
  }

  renderRecords();
  showMessage("Feedback deleted successfully.", "success");
}

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage("Edit cancelled.", "success");
});

searchInput.addEventListener("input", renderRecords);

// Display previously saved records when the page opens.
renderRecords();
