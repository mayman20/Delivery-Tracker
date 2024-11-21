document.addEventListener('DOMContentLoaded', () => {
    fetch('deliveries.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        const deliveriesContainer = document.getElementById('deliveries-container');
  
        if (data.length === 0) {
          deliveriesContainer.innerHTML = '<p>No deliveries to display.</p>';
          return;
        }
  
        data.forEach(delivery => {
          const deliveryCard = document.createElement('div');
          deliveryCard.className = 'delivery-card';
  
          deliveryCard.innerHTML = `
            <h2>Delivery #${delivery.id}</h2>
            <p><strong>Item:</strong> ${delivery.item}</p>
            <p><strong>Status:</strong> ${delivery.status}</p>
            <p><strong>Estimated Delivery:</strong> ${delivery.estimatedDelivery}</p>
          `;
  
          deliveriesContainer.appendChild(deliveryCard);
        });
      })
      .catch(error => {
        console.error('Error fetching deliveries:', error);
        const deliveriesContainer = document.getElementById('deliveries-container');
        deliveriesContainer.innerHTML = '<p>Sorry, there was an error loading the deliveries.</p>';
      });
  });
  