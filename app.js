
function initMap() {
    // Initial location of map
    const options = {
        zoom: 12,
        center: { lat: 48.8737815, lng: 2.3442197 },
    }

    // The map, centered at Paris
    const map = new google.maps.Map(document.getElementById('map'), options);
    app.map = map;

    // Fetch Json
    fetch("restaurants.json").then(data => {
        return data.json()
    }).then(restaurants => {
        restaurants.forEach(restaurant => {

            // new Restaurant Object
            const res = new Restaurant(restaurant.restaurantName, restaurant.address, restaurant.lat, restaurant.long)

            // add Ratings
            for (const rating of restaurant.ratings) {
                res.leaveRating(rating)
            }

            app.createRestaurantCards(res, "cards")
            app.restaurants.push(res)
            app.addMarker(res)
            app.avgRating(res)
            app.displayFeturedRestaurants(res)
        });
    });
    app.searchBox();
    // app.getMyLocation();
    // add new marker event listener
    app.map.addListener('click', function (e) {

        const lat = e.latLng.lat();
        const lng = e.latLng.lng()
        app.clickToAddRestaurantMarker(e.latLng);

        //dunno how to listen for events on inforwindow for multiple buttons
        const infoWindow = new google.maps.InfoWindow({
            content: '<div class="text-center">' +
                `<button id="NewRestaurantBtn" onClick="app.createNewRestaurantForm(${lat}, ${lng})" class="btn btn-info  my-4" type="button">Create new Restaurant</button>` +
                `<button id="cancelNewRestaurantBtn" onClick="app.deleteLastMarker()" class="btn my - 4 btn - danger" type="button">Cancel</button>` +
                '</div>'
        });

        infoWindow.setPosition(e.latLng)
        infoWindow.open(app.map)
    });

    const request = {
        location: new google.maps.LatLng(latLng.lat(), latLng.lng()),
        radius: '500',
        type: ['restaurant']
    };
    app.service = new google.maps.places.PlacesService(app.map);
    app.service.nearbySearch(request, app.serviceCallback());


}

const app = {

    restaurants: [],
    map: null,
    markers: [],
    featuredRestaurants: [],
    service: null,

    serviceCallback: function () {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                var place = results[i];
                createMarker(results[i]);
            }
        }


    },

    clickToAddRestaurantMarker: function (latLng) {
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(latLng.lat(), latLng.lng()),
            map: this.map,
            title: 'newRestaurantMarker'
        });

        this.markers.push(marker)
        this.map.panTo(latLng);
    },

    deleteLastMarker: function () {
        const marker = app.markers.pop()
        marker.setMap(null)
    },

    displayFeturedRestaurants: function (restaurant) {


        if (this.avgRating(restaurant) > 4) {

            this.featuredRestaurants.push(restaurant);
            this.featuredRestaurants.slice(0, 3);
            this.createRestaurantCards(restaurant, `featuredCard${this.featuredRestaurants.length}`)
        }
    },

    displayRestaurantReviews: function (res, displayLocation) {

        const div = document.getElementById(displayLocation);
        let innerHtml = `<h1 class="text-center"> ${res.restaurantName} Reviews</h1>`;

        for (const review of res.ratings) {

            const ratings = `<div class="card mb-2">
                            <div class="card-body">
                            <h6 class="card-title orange-text pb-2 pt-1">${app.displayRating(review.stars)}</h6>
                            <p class="card-text font-weight-bolder">"${review.comment}"</p>
                            </div>
                            </div>`;

            innerHtml = innerHtml + ratings;
        }

        div.innerHTML = innerHtml
    },

    getMyLocation: function () {
        const infoWindow = new google.maps.InfoWindow;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                infoWindow.setPosition(pos);
                infoWindow.setContent('Location found.');
                infoWindow.open(map);
                this.map.panTo(pos);
            }, function () {
                handleLocationError(true, infoWindow, this.map.getCenter(), this.map);
            });
        } else {
            // Browser doesn't support Geolocation
            handleLocationError(false, infoWindow, this.map.getCenter(), this.map);
        }

        function handleLocationError(browserHasGeolocation, infoWindow, pos, map) {
            infoWindow.setPosition(pos);
            infoWindow.setContent(browserHasGeolocation ?
                'Error: The Geolocation service failed.' :
                'Error: Your browser doesn\'t support geolocation.');
            infoWindow.open(map);
        }
    },

    createRestaurantCards: function (restaurant, div) {
        var col = document.getElementById(div);
        var card = document.createElement('div');
        var cardImg = document.createElement('div');
        var cardBody = document.createElement('div');

        card.className = 'restaurantCards card-cascade wider mt-3 mb-3'
        cardImg.className = 'view view-cascade overlay'
        cardBody.className = 'card-body card-body-cascade indigo'

        cardImg.innerHTML = `<img class="card-img-top"
                                src="https://mdbootstrap.com/img/Photos/Lightbox/Thumbnail/img%20(147).jpg"
                                alt="Card image cap">
                            <a>
                                <div class="mask rgba-white-slight"></div>
                            </a>`

        cardBody.innerHTML = `<h5 class="orange-text pb-2 pt-1">${app.displayAvgRating(app.avgRating(restaurant))}</h5>
                              <h4 id="restaurantName" class="font-weight-bold card-title text-white">${restaurant.restaurantName}</h4>
                              <p class="card-text text-white">${restaurant.address}</p>
                              <div class="d-flex justify-content-around align-self-end">
                              <a id="moreInfo${restaurant.restaurantName}" class="btn btn-unique peach-gradient">More info</a>
                              <a onclick="app.leaveReviewForm('${restaurant.restaurantName}')" id="${restaurant.restaurantName}Button" class="btn btn-unique peach-gradient">Leave Review</a>
                              </div>
                              `

        card.appendChild(cardImg);
        card.appendChild(cardBody);
        col.appendChild(card)

        const info = document.getElementById('moreInfo' + restaurant.restaurantName);

        info.addEventListener('click', function () {

            app.displayRestaurantReviews(restaurant, "viewRestaurantReviews")
        })
    },

    displayAvgRating: function (avg) {
        let star = '<i class="fas fa-star"></i> ';
        let halfstar = '<i class="fas fa-star-half"></i> ';
        let starsHTML;

        switch (true) {
            case (avg < 1):
                starsHTML = halfstar;
                break;
            case (avg >= 1 && avg <= 1.5):
                starsHTML = star;
                break;
            case (avg >= 1.5 && avg < 2):
                starsHTML = star + halfstar;
                break;
            case (avg >= 2 && avg < 2.5):
                starsHTML = star + star;
                break;
            case (avg >= 2.5 && avg < 3):
                starsHTML = star + star + halfstar;
                break;
            case (avg >= 3 && avg < 3.5):
                starsHTML = star + star + star;
                break;
            case (avg >= 3.5 && avg < 4):
                starsHTML = star + star + star + halfstar;
                break;
            case (avg >= 4 && avg < 4.5):
                starsHTML = star + star + star + star;
                break;
            case (avg >= 4.5 && avg < 5):
                starsHTML = star + star + star + star + halfstar;
                break;
            case (avg > 5):
                starsHTML = star + star + star + star + star;
                break;
        }
        return starsHTML;
    },

    displayRating: function (sr) {
        let star = '<i class="fas fa-star"></i> ';
        let starsHTML;

        switch (true) {
            case (sr === 1):
                starsHTML = star;
                break;
            case (sr === 2):
                starsHTML = star + star;
                break;
            case (sr === 3):
                starsHTML = star + star + star;
                break;
            case (sr === 4):
                starsHTML = star + star + star + star;
                break;
            case (sr === 5):
                starsHTML = star + star + star + star + star;
                break;
        }
        return starsHTML;
    },

    avgRating: function (restaurant) {
        let total = 0;
        let num = 0;
        for (const starRating of restaurant.ratings) {

            total = total + starRating.stars;
            num++
        }
        return avg = total / num;
    },

    addMarker: function (restaurant) {
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(restaurant.lat, restaurant.long),
            title: restaurant.restaurantName,
            map: this.map
        });
        this.markers.push(marker)
        marker.addListener('click', function () {
            app.map.setZoom(12);
            app.map.setCenter(marker.getPosition());
        });
    },

    leaveReviewForm: function (restaurantName) {
        const form = document.getElementById("leaveReview");
        form.innerHTML = '<form class="text-center border border-light p-5" action="#!">' +
            '<p class="h4 mb-4">Leave Review</p>' +
            '<input name="rating" type="text" id="defaultContactFormName" class="form-control mb-4" placeholder="Name">' +
            '<input type="email" id="defaultContactFormEmail" class="form-control mb-4" placeholder="E-mail">' +
            '<div class="d-flex mb-1">' +
            '<div class="custom-control custom-radio mr-3">' +
            '<input name="rating" type="radio" value="1" class="custom-control-input" id="defaultGroupExample1">' +
            '<label class="custom-control-label" for="defaultGroupExample1">1 Star</label>' +
            '</div>' +
            '<div class="custom-control custom-radio mr-3">' +
            '<input name="rating" type="radio" value="2" class="custom-control-input" id="defaultGroupExample2">' +
            '<label class="custom-control-label" for="defaultGroupExample2">2 Stars</label>' +
            '</div>' +
            '<div class="custom-control custom-radio mr-3">' +
            '<input name="rating" type="radio" value="3" class="custom-control-input" id="defaultGroupExample3">' +
            '<label class="custom-control-label" for="defaultGroupExample3">3 Stars</label>' +
            '</div>' +
            '<div class="custom-control custom-radio mr-3">' +
            '<input name="rating" type="radio" value="4" class="custom-control-input" id="defaultGroupExample4">' +
            '<label class="custom-control-label" for="defaultGroupExample4">4 Stars</label>' +
            '</div>' +
            '<div class="custom-control custom-radio mr-3">' +
            '<input name="rating" type="radio" value="5" class="custom-control-input" id="defaultGroupExample5">' +
            '<label class="custom-control-label" for="defaultGroupExample5">5 Stars</label>' +
            '</div>' +
            '</div>' +
            '<div class="form-group">' +
            '<textarea class="form-control rounded-0" id="exampleFormControlTextarea2" rows="3" placeholder="Feedback"></textarea>' +
            '</div>' +
            '<div class="custom-control custom-checkbox mb-4">' +
            '<input type="checkbox" class="custom-control-input" id="defaultContactFormCopy">' +
            '<label class="custom-control-label" for="defaultContactFormCopy">Send me a copy of this message</label></div>' +
            '<!-- Send button -->' +
            '<div class="text-center">' +
            '<button id="leaveReviewBtn" class="btn btn-info my-4" type="button">Leave review</button>' +
            '<button id="cancelReviewBtn" class="btn my-4 btn-danger" type="button">Cancel</button>' +
            '</div>' +
            '</form>'

        document.getElementById("leaveReviewBtn").onclick = function () {

            const res = app.restaurants.find(function (restaurant) {

                return restaurant.restaurantName === restaurantName;
            })

            const stars = document.querySelector('input[name="rating"]:checked').value;
            const message = document.getElementById("exampleFormControlTextarea2").value;
            const rating = new Rating(parseInt(stars, 10), message);
            res.leaveRating(rating)

            form.innerHTML = `<div class="alert alert-primary" role="alert">
            Thanks for leaving your Review
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`
        }
    },

    createNewRestaurant: function (restaurantName, address, lat, lng) {

        const restaurant = new Restaurant(restaurantName, address, lat, lng)
        this.restaurants.push(restaurant)
        return restaurant;
    },

    createNewRestaurantForm: function (lat, lng) {
        const form = document.getElementById("newRestaurantForm");
        form.innerHTML = `<form class="border border-light p-5">
                            <p class="h4 mb-4 text-center">Register a restaurant</p>
                            <input type="text" id="newRestaurantName" class="form-control mb-4" placeholder="Restaurant name">
                            <input type="text" id="newRestaurantAddress" class="form-control mb-4" placeholder="Restaurant address">
                            <div class="text-center">
                            <button id="createRestaurantBtn" class="btn btn-info my-4" type="button">Create new Restaurant</button>
                            <button id="cancelRestaurantBtn" class="btn my-4 btn-danger" type="button">Cancel</button>
                            </div>
                            <div class="text-center">
                            <p>Not a member?
                            <a href="">Register</a>
                            </p>
                            <p>or sign in with:</p>
                            <a type="button" class="light-blue-text mx-2">
                            <i class="fab fa-facebook-f"></i>
                            </a>
                            <a type="button" class="light-blue-text mx-2">
                            <i class="fab fa-twitter"></i>
                            </a>
                            <a type="button" class="light-blue-text mx-2">
                            <i class="fab fa-linkedin-in"></i>
                            </a>
                            <a type="button" class="light-blue-text mx-2">
                            <i class="fab fa-github"></i>
                            </a>
                            </div>
                            </form>`

        document.getElementById("createRestaurantBtn").onclick = function () {
            const newRestaurantName = document.getElementById("newRestaurantName").value;
            const newRestaurantAddress = document.getElementById("newRestaurantAddress").value;

            const restaurant = new Restaurant(newRestaurantName, newRestaurantAddress, lat, lng);
            app.createRestaurantCards(restaurant, "cards")

            form.innerHTML = `<div class="alert alert-primary" role="alert">
                            Restaurant successfully created
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                            </button>
                            </div>`
        }

        document.getElementById("cancelRestaurantBtn").onclick = function () {
            const marker = app.markers.pop()
            marker.setMap(null)
            form.innerHTML = `<div class="alert alert-warning" role="alert">
                            Restaurant canceled
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                            </button>
                            </div>`;
        }
    },

    searchBox: function () {
        const input = document.getElementById("search");
        const searchBox = new google.maps.places.SearchBox(input);

        this.map.addListener('bounds_changed', function () {
            searchBox.setBounds(app.map.getBounds());
        });

        searchBox.addListener('places_changed', function () {
            const places = searchBox.getPlaces();

            if (places.length === 0) {
                return;
            }

            app.markers.forEach(function (marker) {
                marker.setMap(null);
            });
            this.markers = [];

            const bounds = new google.maps.LatLngBounds();

            places.forEach(function (place) {
                if (!place.geometry) {
                    return;
                }

                app.markers.push(new google.maps.Marker({
                    map: this.map,
                    title: place.name,
                    position: place.geometry.location

                }));

                if (place.geometry.viewport) {
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extends(place.geometry.location);
                }
            });
            app.map.fitBounds(bounds);
        });
    }
}

class Restaurant {
    constructor(name, address, lat, long) {
        this.restaurantName = name;
        this.address = address;
        this.lat = lat;
        this.long = long;
        this.ratings = [];
    }

    leaveRating(newRating) {
        const rating = new Rating(newRating.stars, newRating.comment)
        this.ratings.push(rating)
    }
}

class Rating {
    constructor(stars, comment) {
        this.stars = stars;
        this.comment = comment;
    }
}
