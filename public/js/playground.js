document.addEventListener('DOMContentLoaded', () => {

    // --- General Setup ---
    let playgroundOptions = {};
    async function getOptions() {
        try {
            const response = await fetch('/api/playground-options');
            playgroundOptions = await response.json();
            populateSelects();
        } catch (error) {
            console.error('Failed to fetch playground options:', error);
        }
    }

    function populateSelects() {
        const satSelect = document.querySelector('#satellite-card .view-select');
        if (satSelect && playgroundOptions.satellite) {
            playgroundOptions.satellite.forEach(opt => {
                const optionEl = document.createElement('option');
                optionEl.value = opt.value;
                optionEl.textContent = opt.label;
                satSelect.appendChild(optionEl);
            });
        }

        const sunSelect = document.querySelector('#sun-card .view-select');
        if (sunSelect && playgroundOptions.sun) {
            playgroundOptions.sun.forEach(opt => {
                const optionEl = document.createElement('option');
                optionEl.value = opt.value;
                optionEl.textContent = opt.label;
                sunSelect.appendChild(optionEl);
            });
        }
    }

    // --- Event Handlers ---
    document.querySelectorAll('.api-card button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const api = event.target.dataset.api;
            const card = event.target.closest('.api-card');
            const resultBox = card.querySelector('.result-box');

            if (!api || !card || !resultBox) return;

            let apiUrl = `/api/${api}`;
            const select = card.querySelector('.view-select');
            if (select) {
                apiUrl += `?view=${select.value}`;
            }

            resultBox.style.display = 'block';
            resultBox.innerHTML = '<p>Fetching...</p>';

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `API Error: ${response.status}`);
                }
                const data = await response.json();

                if (api === 'iss-location') {
                    resultBox.textContent = JSON.stringify(data, null, 2);
                } else {
                    resultBox.innerHTML = `
                        <h3>${data.title}</h3>
                        <img src="${data.imageUrl}" alt="${data.title}" />
                    `;
                }

            } catch (error) {
                console.error(`Error fetching ${api}:`, error);
                resultBox.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    });

    // --- Initialize ---
    getOptions();
});
