document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // 1. LOCAL STORAGE FUNCTIONS
    // =====================================

    function getData(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (error) {
            return [];
        }
    }

    function saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    }

    function money(value) {
        return "KSh " + Number(value || 0).toFixed(2);
    }

    function showMessage(message) {
        alert(message);
    }


    // =====================================
    // 2. CHECK WHETHER A COW EXISTS
    // =====================================

    function cowExists(tag) {
        return getData("cows").some(function (cow) {
            return String(cow.tagNumber || "").toLowerCase() ===
                String(tag || "").toLowerCase();
        });
    }


    // =====================================
    // 3. GENERAL EDIT AND DELETE SYSTEM
    // =====================================

    function setupModule(config) {

        const form = document.getElementById(config.form);
        const table = document.getElementById(config.table);

        const searchInput = config.search
            ? document.getElementById(config.search)
            : null;

        if (!form || !table) return;

        let editingIndex = null;

        const submitButton = form.querySelector('[type="submit"]');

        if (!submitButton) {
            console.error("Submit button not found:", config.form);
            return;
        }

        // Create Cancel Edit button
        const cancelButton = document.createElement("button");

        cancelButton.type = "button";
        cancelButton.textContent = "Cancel Edit";
        cancelButton.style.display = "none";
        cancelButton.style.marginLeft = "10px";

        submitButton.insertAdjacentElement("afterend", cancelButton);


        // =====================================
        // DISPLAY RECORDS AND SEARCH
        // =====================================

        function displayRecords() {

            let records = getData(config.key);

            // Attach original indexes to records
            let indexedRecords = records.map(function (record, index) {
                return {
                    record: record,
                    originalIndex: index
                };
            });

            // Filter records when search is available
            if (searchInput) {

                const searchTerm = searchInput.value
                    .trim()
                    .toLowerCase();

                indexedRecords = indexedRecords.filter(function (item) {

                    const tag = String(
                        item.record.tagNumber || ""
                    ).toLowerCase();

                    const name = String(
                        item.record.cowName || ""
                    ).toLowerCase();

                    return tag.includes(searchTerm) ||
                           name.includes(searchTerm);

                });

            }

            table.innerHTML = "";

            indexedRecords.forEach(function (item) {

                const record = item.record;
                const index = item.originalIndex;

                const row = document.createElement("tr");

                // Display record details
                config.columns.forEach(function (column) {

                    let value = record[column.key];

                    if (column.format) {
                        value = column.format(value);
                    }

                    const cell = document.createElement("td");

                    cell.textContent = value ?? "";

                    row.appendChild(cell);

                });

                // Actions cell
                const actionCell = document.createElement("td");

                const editButton = document.createElement("button");

                editButton.type = "button";
                editButton.textContent = "Edit";
                editButton.dataset.action = "edit";
                editButton.dataset.index = index;

                const deleteButton = document.createElement("button");

                deleteButton.type = "button";
                deleteButton.textContent = "Delete";
                deleteButton.dataset.action = "delete";
                deleteButton.dataset.index = index;

                actionCell.appendChild(editButton);
                actionCell.appendChild(deleteButton);

                row.appendChild(actionCell);

                table.appendChild(row);

            });

        }


        // SEARCH EVENT
        if (searchInput) {
            searchInput.addEventListener("input", displayRecords);
        }


        // =====================================
        // RESET FORM
        // =====================================

        function resetForm() {

            form.reset();

            editingIndex = null;

            submitButton.textContent = config.buttonText;

            cancelButton.style.display = "none";

        }


        // =====================================
        // SAVE OR UPDATE RECORD
        // =====================================

        form.addEventListener("submit", function (event) {

            event.preventDefault();

            const values = {};

            config.fields.forEach(function (field) {
                values[field.key] = getValue(field.id);
            });

            const records = getData(config.key);

            // Validation
            if (config.validate) {

                const error = config.validate(
                    values,
                    records,
                    editingIndex
                );

                if (error) {
                    showMessage(error);
                    return;
                }

            }

            // Build record
            const record = config.build(values);

            // Save or update
            if (editingIndex === null) {

                records.push(record);

                showMessage(config.successMessage);

            } else {

                records[editingIndex] = record;

                showMessage("Record updated successfully!");

            }

            saveData(config.key, records);

            resetForm();

            displayRecords();

            updateDashboard();

        });


        // =====================================
        // EDIT AND DELETE BUTTONS
        // =====================================

        table.addEventListener("click", function (event) {

            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const index = Number(button.dataset.index);

            const records = getData(config.key);

            if (!Number.isInteger(index) || !records[index]) return;


            // EDIT RECORD
            if (button.dataset.action === "edit") {

                const record = records[index];

                config.fields.forEach(function (field) {

                    const input = document.getElementById(field.id);

                    if (input) {
                        input.value = record[field.key] ?? "";
                    }

                });

                editingIndex = index;

                submitButton.textContent = "Update Record";

                cancelButton.style.display = "inline-block";

                form.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }


            // DELETE RECORD
            else if (button.dataset.action === "delete") {

                if (confirm("Are you sure you want to delete this record?")) {

                    records.splice(index, 1);

                    saveData(config.key, records);

                    displayRecords();

                    updateDashboard();

                    if (editingIndex === index) {

                        resetForm();

                    } else if (
                        editingIndex !== null &&
                        editingIndex > index
                    ) {

                        editingIndex--;

                    }

                    showMessage("Record deleted successfully!");

                }

            }

        });


        // CANCEL EDIT
        cancelButton.addEventListener("click", resetForm);


        // LOAD EXISTING RECORDS
        displayRecords();

    }



    // =====================================
    // 4. COW MANAGEMENT
    // =====================================

    setupModule({

        key: "cows",

        form: "cowForm",

        table: "cowTable",

        search: "cowSearch",

        buttonText: "Register Cow",

        successMessage: "Cow registered successfully!",

        fields: [
            { id: "tagNumber", key: "tagNumber" },
            { id: "cowName", key: "cowName" },
            { id: "breed", key: "breed" },
            { id: "sex", key: "sex" },
            { id: "dob", key: "dob" },
            { id: "status", key: "status" }
        ],

        columns: [
            { key: "tagNumber" },
            { key: "cowName" },
            { key: "breed" },
            { key: "sex" },
            { key: "dob" },
            { key: "status" }
        ],

        validate: function (values, records, editingIndex) {

            const exists = records.some(function (cow, index) {

                return index !== editingIndex &&
                    String(cow.tagNumber || "").toLowerCase() ===
                    values.tagNumber.toLowerCase();

            });

            if (exists) {
                return "This cow is already registered.";
            }

            return "";

        },

        build: function (v) {

            return {
                tagNumber: v.tagNumber,
                cowName: v.cowName,
                breed: v.breed,
                sex: v.sex,
                dob: v.dob,
                status: v.status
            };

        }

    });



    // =====================================
    // 5. MILK PRODUCTION
    // =====================================

    setupModule({

        key: "milk",
        form: "milkForm",
        table: "milkTable",

        buttonText: "Save Milk Record",
        successMessage: "Milk production recorded successfully!",

        fields: [
            { id: "milkCowTag", key: "cowTag" },
            { id: "milkDate", key: "date" },
            { id: "morningMilk", key: "morning" },
            { id: "eveningMilk", key: "evening" }
        ],

        columns: [
            { key: "cowTag" },
            { key: "date" },
            { key: "morning" },
            { key: "evening" },
            { key: "total" }
        ],

        validate: function (v) {

            if (!cowExists(v.cowTag)) {
                return "Register this cow before recording milk.";
            }

            if (
                v.morning === "" ||
                v.evening === "" ||
                Number(v.morning) < 0 ||
                Number(v.evening) < 0
            ) {
                return "Enter valid milk quantities.";
            }

            return "";

        },

        build: function (v) {

            const morning = Number(v.morning);
            const evening = Number(v.evening);

            return {
                cowTag: v.cowTag,
                date: v.date,
                morning: morning,
                evening: evening,
                total: morning + evening
            };

        }

    });



    // =====================================
    // 6. ANIMAL HEALTH
    // =====================================

    setupModule({

        key: "health",
        form: "healthForm",
        table: "healthTable",

        buttonText: "Save Health Record",
        successMessage: "Health record saved successfully!",

        fields: [
            { id: "healthCowTag", key: "cowTag" },
            { id: "healthDate", key: "date" },
            { id: "healthType", key: "type" },
            { id: "healthDescription", key: "description" },
            { id: "treatment", key: "treatment" }
        ],

        columns: [
            { key: "cowTag" },
            { key: "date" },
            { key: "type" },
            { key: "description" },
            { key: "treatment" }
        ],

        validate: function (v) {

            if (!cowExists(v.cowTag)) {
                return "Register this cow first.";
            }

            return "";

        },

        build: function (v) {

            return {
                cowTag: v.cowTag,
                date: v.date,
                type: v.type,
                description: v.description,
                treatment: v.treatment
            };

        }

    });



    // =====================================
    // 7. BREEDING MANAGEMENT
    // =====================================

    setupModule({

        key: "breeding",
        form: "breedingForm",
        table: "breedingTable",

        buttonText: "Save Breeding Record",
        successMessage: "Breeding record saved successfully!",

        fields: [
            { id: "breedingCowTag", key: "cowTag" },
            { id: "inseminationDate", key: "inseminationDate" },
            { id: "breedingMethod", key: "method" },
            { id: "bullDetails", key: "bullDetails" },
            { id: "calvingDate", key: "calvingDate" }
        ],

        columns: [
            { key: "cowTag" },
            { key: "inseminationDate" },
            { key: "method" },
            { key: "bullDetails" },
            { key: "calvingDate" }
        ],

        validate: function (v) {

            if (!cowExists(v.cowTag)) {
                return "Register this cow first.";
            }

            return "";

        },

        build: function (v) {

            return {
                cowTag: v.cowTag,
                inseminationDate: v.inseminationDate,
                method: v.method,
                bullDetails: v.bullDetails,
                calvingDate: v.calvingDate
            };

        }

    });



    // =====================================
    // 8. MILK SALES
    // =====================================

    setupModule({

        key: "sales",
        form: "salesForm",
        table: "salesTable",

        buttonText: "Save Sale",
        successMessage: "Sale recorded successfully!",

        fields: [
            { id: "saleDate", key: "date" },
            { id: "buyer", key: "buyer" },
            { id: "quantitySold", key: "quantity" },
            { id: "pricePerLitre", key: "price" }
        ],

        columns: [
            { key: "date" },
            { key: "buyer" },
            { key: "quantity" },
            { key: "price", format: money },
            { key: "total", format: money }
        ],

        validate: function (v) {

            if (
                v.quantity === "" ||
                v.price === "" ||
                Number(v.quantity) <= 0 ||
                Number(v.price) <= 0
            ) {
                return "Enter a valid quantity and price.";
            }

            return "";

        },

        build: function (v) {

            const quantity = Number(v.quantity);
            const price = Number(v.price);

            return {
                date: v.date,
                buyer: v.buyer,
                quantity: quantity,
                price: price,
                total: quantity * price
            };

        }

    });



    // =====================================
    // 9. FARM EXPENSES
    // =====================================

    setupModule({

        key: "expenses",
        form: "expenseForm",
        table: "expensesTable",

        buttonText: "Save Expense",
        successMessage: "Expense recorded successfully!",

        fields: [
            { id: "expenseDate", key: "date" },
            { id: "expenseCategory", key: "category" },
            { id: "expenseDescription", key: "description" },
            { id: "expenseAmount", key: "amount" }
        ],

        columns: [
            { key: "date" },
            { key: "category" },
            { key: "description" },
            { key: "amount", format: money }
        ],

        validate: function (v) {

            if (
                v.amount === "" ||
                Number(v.amount) <= 0
            ) {
                return "Enter a valid expense amount.";
            }

            return "";

        },

        build: function (v) {

            return {
                date: v.date,
                category: v.category,
                description: v.description,
                amount: Number(v.amount)
            };

        }

    });



    // =====================================
    // 10. DASHBOARD CALCULATIONS
    // =====================================

    function updateDashboard() {

        const cows = getData("cows");
        const milk = getData("milk");
        const sales = getData("sales");
        const expenses = getData("expenses");

        const totalMilk = milk.reduce(function (sum, record) {
            return sum + Number(record.total || 0);
        }, 0);

        const totalSales = sales.reduce(function (sum, record) {
            return sum + Number(record.total || 0);
        }, 0);

        const totalExpenses = expenses.reduce(function (sum, record) {
            return sum + Number(record.amount || 0);
        }, 0);

        const cowElement = document.getElementById("totalCows");
        const milkElement = document.getElementById("totalMilk");
        const salesElement = document.getElementById("totalSales");
        const expenseElement = document.getElementById("totalExpenses");

        if (cowElement) {
            cowElement.textContent = cows.length;
        }

        if (milkElement) {
            milkElement.textContent = totalMilk.toFixed(2) + " L";
        }

        if (salesElement) {
            salesElement.textContent = money(totalSales);
        }

        if (expenseElement) {
            expenseElement.textContent = money(totalExpenses);
        }

    }


    // INITIALIZE DASHBOARD

    updateDashboard();

    console.log("Dairy Farm Management System loaded successfully.");

});
