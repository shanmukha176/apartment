const token = localStorage.getItem('token');

const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user || user.role !== 'staff') {
    window.location.href = 'login.html';
}

async function loadTasks() {
    try {
        const response = await fetch('/api/staff/tasks', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Unable to load tasks');

        const tasks = await response.json();

        const tbody = document.getElementById('staffTaskList');
        tbody.replaceChildren();

        tasks.forEach(task => {
            const tr = document.createElement('tr');

            const values = [
                task.request_id,
                task.resident_name,
                task.apartment_no || '-',
                task.title,
                task.description,
                task.priority,
                task.status
            ];

            values.forEach(value => {
                const td = document.createElement('td');
                td.textContent = value || '';
                tr.appendChild(td);
            });

            const actionCell = document.createElement('td');

            const statusSelect = document.createElement('select');

            ['In Progress', 'Completed'].forEach(status => {
                const option = document.createElement('option');

                option.value = status;
                option.textContent = status;

                if (task.status === status) {
                    option.selected = true;
                }

                statusSelect.appendChild(option);
            });

            const updateButton = document.createElement('button');

            updateButton.textContent = 'Update';
            updateButton.className = 'btn';

            updateButton.addEventListener('click', () => {
                updateTask(task.request_id, statusSelect.value);
            });

            actionCell.append(statusSelect, updateButton);

            tr.appendChild(actionCell);
            tbody.appendChild(tr);
        });

    } catch (error) {
        alert(error.message);
    }
}

async function updateTask(requestId, status) {
    try {
        const response = await fetch(
            `/api/staff/tasks/${requestId}/status`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status,
                    remarks: 'Updated by maintenance staff'
                })
            }
        );

        const result = await response.json();

        if (!response.ok) throw new Error(result.message);

        alert(result.message);
        loadTasks();

    } catch (error) {
        alert(error.message);
    }
}

if (token && user && user.role === 'staff') {
    loadTasks();
}