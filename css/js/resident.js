const token = localStorage.getItem('token');

function checkResident() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'resident') {
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

async function loadCategories() {
    try {
        const response = await fetch('/api/requests/categories', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Unable to load categories');

        const categories = await response.json();

        const select = document.getElementById('category_id');

        categories.forEach(category => {
            const option = document.createElement('option');

            option.value = category.category_id;
            option.textContent = category.category_name;

            select.appendChild(option);
        });

    } catch (error) {
        document.getElementById('message').textContent = error.message;
    }
}

// Submit request
document.getElementById('requestForm')
    .addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            title: document.getElementById('title').value,
            category_id: document.getElementById('category_id').value,
            description: document.getElementById('description').value,
            priority: document.getElementById('priority').value
        };

        try {
            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            document.getElementById('message').textContent =
                result.message;

            e.target.reset();

            await loadRequests();

        } catch (error) {
            document.getElementById('message').textContent =
                error.message;
        }
    });

// Display requests
async function loadRequests() {
    try {
        const response = await fetch('/api/requests/my', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Unable to load requests');

        const requests = await response.json();

        const tbody = document.getElementById('requestList');
        tbody.replaceChildren();

        requests.forEach(request => {
            const tr = document.createElement('tr');

            [
                request.request_id,
                request.title,
                request.category_name,
                request.priority,
                request.status,
                request.staff_name || 'Not Assigned'
            ].forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
    }
}

if (checkResident()) {
    loadCategories();
    loadRequests();
}