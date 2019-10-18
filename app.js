
function initMap() {
    // Initial location of map
    let options = {
        zoom: 16,
        center: { lat: 48.8737815, lng: 2.3442197 },
    }

    // The map, centered at Paris
    const map = new google.maps.Map(document.getElementById('map'), options);
    app.map = map;

    const infoWindow = new google.maps.InfoWindow;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            app.userPosition = pos;
            const image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
            const marker = new google.maps.Marker({
                position: new google.maps.LatLng(pos),
                map: app.map,
                title: 'You are here',
                icon: image
            });

            //options.center.lat = pos.lat;
            //options.center.lng = pos.lng;
            app.markers.push(marker)
            infoWindow.setPosition(pos);
            //app.map.panTo(pos);
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
        infoWindow.open(app.map);
    }

    // Fetch Json for sample data
    fetch("restaurants.json").then(data => {
        return data.json()
    }).then(restaurants => {
        restaurants.forEach(restaurant => {

            // new Restaurant Object
            const res = new Restaurant(restaurant.restaurantName, restaurant.address, restaurant.Id, restaurant.lat, restaurant.long, restaurant.rating, restaurant.photoUrl)

            // add Ratings
            for (const rating of restaurant.ratings) {
                res.leaveRating(rating.stars, rating.comment)
            }

            app.restaurants.push(res)
            app.addMarker(res)
            res.rating = app.avgRating(res)
            app.displayFeturedRestaurants(res)
        });
    });

    // searchbar recomendations 
    app.searchBox();
    // app.getMyLocation();

    // add new marker event listener
    app.map.addListener('click', function (e) {

        const lat = e.latLng.lat();
        const lng = e.latLng.lng()
        app.clickToAddRestaurantMarker(e.latLng);

        //InfoWindow with two buttons
        const infoWindow = new google.maps.InfoWindow({
            content: '<div class="text-center">' +
                `<button id="NewRestaurantBtn" onClick="app.createNewRestaurantForm(${lat}, ${lng})" class="btn btn-info" type="button">Create new Restaurant</button>` +
                `<button id="cancelNewRestaurantBtn" onClick="app.deleteLastMarker()" class="btn" type="button">Cancel</button>` +
                '</div>'
        });
        app.infoWindow = infoWindow;
        infoWindow.setPosition(e.latLng)
        infoWindow.open(app.map)
    });
    /* PLACESERVICE REQUEST. */
    var request = {
        location: options.center,
        radius: '500',
        type: ['restaurant']
    };

    service = new google.maps.places.PlacesService(app.map);
    service.nearbySearch(request, app.serviceCallback);

}

var app = {

    restaurants: [],
    map: null,
    markers: [],
    featuredRestaurants: [],
    service: null,
    nearbyRestaurants: [],
    userPosition: null,
    InfoWindow: null,

    // ServiceCallback for PlaceService request. Adds Markers on map
    serviceCallback: function (results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                var place = results[i];
                const marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: app.map,
                    title: place.name
                });
                if (place && place.photos) {
                    app.markers.push(marker)
                    let restaurant = new Restaurant(
                        place.name, place.vicinity, place.place_id, place.geometry.location.lat(), place.geometry.location.lng(), place.rating, place.photos[0].getUrl({ maxHeight: 250 }))

                    app.nearbyRestaurants.push(restaurant);
                }
            }
        } else {
            alert(status);
        }
        app.displayNearbyRestaurants();
    },

    // Add marker when user clicks on Map
    clickToAddRestaurantMarker: function (latLng) {
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(latLng.lat(), latLng.lng()),
            map: this.map,
            title: 'newRestaurantMarker'
        });

        this.markers.push(marker)
        this.map.panTo(latLng);
    },

    // Delete (last) Marker if user cancels on InfoWindow
    deleteLastMarker: function () {
        const marker = app.markers.pop()
        marker.setMap(null)
        this.infoWindow.close();
    },

    // Displays featured restaurants 
    displayFeturedRestaurants: function (restaurant) {
        if (restaurant.rating > 4) {
            this.featuredRestaurants.push(restaurant);
            this.featuredRestaurants.slice(0, 3);
            this.createRestaurantCards(restaurant, `featuredCard${this.featuredRestaurants.length}`)
        }
    },

    // Display restaurants reviews
    displayRestaurantReviews: function (res, reviews, displayLocation) {
        const div = document.getElementById(displayLocation);
        for (let i = 0; i < reviews.length; i++) {
            console.log(reviews.length)
            let ratings = `<div class="ratingsCard card mb-2 z-depth-2">
                            <div class="ratingsCardBody card-body blue-gradient">
                            <h6 class="card-title white-text font-weight-bolder pb-2 pt-1">${reviews[i].author_name}</h6>
                            <h6 class="card-title orange-text">${app.displayRating(reviews[i].rating)}</h6>
                            <p class="card-text white-text ">"${reviews[i].text}"</p>
                            </div>
                    </div>`;

            div.innerHTML += ratings;
        }
    },

    // Gets user geolocation
    getMyLocation: function () {
        const infoWindow = new google.maps.InfoWindow;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                app.userPosition = pos;
                const image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
                const marker = new google.maps.Marker({
                    position: new google.maps.LatLng(pos),
                    map: this.map,
                    title: 'You are here',
                    icon: image
                });

                infoWindow.setPosition(pos);
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
            infoWindow.open(app.map);
        }
    },

    // Displays nearby restaurants NOT WORKING!!
    displayNearbyRestaurants: function () {
        const container = document.getElementById('placeResults');
        container.innerHTML = '';
        document.getElementById('nearbyCard1').innerHTML = '';
        document.getElementById('nearbyCard2').innerHTML = '';
        this.createRestaurantCards(this.nearbyRestaurants[0], `nearbyCard1`)
        this.createRestaurantCards(this.nearbyRestaurants[1], `nearbyCard2`)

        for (let i = 2; i < this.nearbyRestaurants.length; i++) {
            const div = document.createElement('div');
            div.className = `placeResult-${i}`;
            div.id = `placeResult-${i}`
            div.style = "padding: 10px;"
            container.appendChild(div)
            this.createRestaurantCards(this.nearbyRestaurants[i], div.id)
        }
    },

    // Creates Restaurants cards
    createRestaurantCards: function (restaurant, div) {
        if (restaurant == null) return;
        var col = document.getElementById(div);
        var card = document.createElement('div');
        var cardImg = document.createElement('div');
        var cardBody = document.createElement('div');

        card.className = 'restaurantCards d-flex flex-column z-depth-2'
        cardImg.className = 'view view-cascade'
        cardBody.className = 'd-flex flex-column flex-fill card-body card-body-restaurants card-body-cascade blue-gradient'

        cardImg.innerHTML = `<img class="card-img-top img-fluid"
                                src="${restaurant.photoUrl}"
                                alt="Card image cap">
                            <a>
                                <div class="mask rgba-white-slight"></div>
                            </a>`

        cardBody.innerHTML = `<h5 class="orange-text pb-2 pt-1">${app.displayAvgRating(restaurant.rating)}</h5>
                              <h4 id="restaurantName" class="font-weight-bold card-title text-white h4-responsive">${restaurant.restaurantName}</h4>
                              <p class="card-text text-white">${restaurant.address}</p>
                              <div class="d-flex h-100 justify-content-center align-items-end">
                              <a id="moreInfo${restaurant.restaurantName}" class="btn btn-unique peach-gradient">More info</a>
                              </div>
                              `

        card.appendChild(cardImg);
        card.appendChild(cardBody);
        col.appendChild(card)

        const info = document.getElementById('moreInfo' + restaurant.restaurantName);

        info.addEventListener('click', function () {

            app.createRestaurantPage(restaurant)
        })
    },

    // Returns AVG star rating in icons
    displayAvgRating: function (avg) {
        let star = '<i class="fas fa-star"></i> ';
        let halfstar = '<i class="fas fa-star-half"></i> ';
        let starsHTML;

        switch (true) {
            case (avg == null):
                starsHTML = 'No data <i class="far fa-frown"></i>';
                break;
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

    // Returns star rating in icons
    displayRating: function (starRating) {
        let star = '<i class="fas fa-star"></i> ';
        let starsHTML;

        switch (true) {
            case (starRating === 1):
                starsHTML = star;
                break;
            case (starRating === 2):
                starsHTML = star + star;
                break;
            case (starRating === 3):
                starsHTML = star + star + star;
                break;
            case (starRating === 4):
                starsHTML = star + star + star + star;
                break;
            case (starRating === 5):
                starsHTML = star + star + star + star + star;
                break;
        }
        return starsHTML;
    },

    // Returns avg rating
    avgRating: function (restaurant) {
        let total = 0;
        let num = 0;
        for (const starRating of restaurant.ratings) {

            total = total + starRating.stars;
            num++
        }
        return avg = total / num;
    },

    // Adds marker to map
    addMarker: function (restaurant) {
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(restaurant.lat, restaurant.long),
            title: restaurant.restaurantName,
            map: this.map
        });
        this.markers.push(marker)
        marker.addListener('click', function () {
            app.map.setZoom(2);
            app.map.setCenter(marker.getPosition());
        });
    },

    // Form to leave a restaurant rating NEED WORK
    leaveReviewForm: function (restaurant) {
        const form = document.getElementById("leaveReview");
        form.innerHTML = '<form class="leaveReviewForm blue-gradient text-center p-5" action="#!">' +
            '<h4 class="h4 mb-4 white-text">Leave Review</h4>' +
            '<input name="rating" type="text" id="authors-name" class="outline-white form-control mb-4" placeholder="Name">' +
            '<div class="d-flex mb-1">' +
            '<div class="custom-control custom-radio mr-1">' +
            '<input name="rating" type="radio" value="1" class="custom-control-input" id="defaultGroupExample1">' +
            '<label class="text-white custom-control-label" for="defaultGroupExample1">1 Star</label>' +
            '</div>' +
            '<div class="custom-control custom-radio mr-1">' +
            '<input name="rating" type="radio" value="2" class="custom-control-input" id="defaultGroupExample2">' +
            '<label class="text-white custom-control-label" for="defaultGroupExample2">2 Stars</label>' +
            '</div>' +
            '<div class="custom-control custom-radio mr-1">' +
            '<input name="rating" type="radio" value="3" class="custom-control-input" id="defaultGroupExample3">' +
            '<label class="text-white custom-control-label" for="defaultGroupExample3">3 Stars</label>' +
            '</div>' +
            '<div class="custom-control custom-radio mr-1">' +
            '<input name="rating" type="radio" value="4" class="custom-control-input" id="defaultGroupExample4">' +
            '<label class="text-white custom-control-label" for="defaultGroupExample4">4 Stars</label>' +
            '</div>' +
            '<div class="custom-control custom-radio mr-1">' +
            '<input name="rating" type="radio" value="5" class="custom-control-input" id="defaultGroupExample5">' +
            '<label class="text-white custom-control-label" for="defaultGroupExample5">5 Stars</label>' +
            '</div>' +
            '</div>' +
            '<div class="form-group">' +
            '<textarea class="form-control rounded-0" id="comments" rows="3" placeholder="Feedback"></textarea>' +
            '</div>' +
            '<!-- Send button -->' +
            '<div class="d-flex justify-content-center">' +
            '<button id="leaveReviewBtn" class="peach-gradient btn" type="button">Leave review</button>' +
            '<button id="cancelReviewBtn" class="btn btn-outline-white" type="button">Cancel</button>' +
            '</div>' +
            '</form>'

        document.getElementById("leaveReviewBtn").onclick = function () {

            const authorName = document.getElementById("authors-name").value
            const stars = Number(document.querySelector('input[name="rating"]:checked').value);
            const message = document.getElementById("comments").value;
            restaurant.leaveRating(stars, message, authorName)
            console.log(restaurant.ratings.length)
            app.displayNewReview({ author_name: authorName, rating: stars, text: message }, 'viewRestaurantReviews')
            form.innerHTML += `<div class="alert alert-primary" role="alert">
            Thanks for leaving your Review
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`
        }
    },
    displayNewReview: function (reviews, displayLocation) {

        const div = document.getElementById(displayLocation);
        let review = `<div class="ratingsCard card mb-2 z-depth-2">
                            <div class="ratingsCardBody card-body blue-gradient">
                            <h6 class="card-title white-text font-weight-bolder pb-2 pt-1">${reviews.author_name}</h6>
                            <h6 class="card-title orange-text">${app.displayRating(reviews.rating)}</h6>
                            <p class="card-text white-text ">"${reviews.text}"</p>
                            </div>
                    </div>`;

        div.innerHTML += review;
    },
    // For to create new Restaurants NEEDS WORK. 
    createNewRestaurantForm: function (lat, lng) {
        const form = document.getElementById("nearbyCard1");
        form.innerHTML = `<form class="newRestaurantForm p-5 blue-gradient z-depth-2">
                            <h4 class="h4 mb-4 text-center text-white">Register a restaurant</h4>
                            <input type="text" id="newRestaurantName" class="form-control mb-4" placeholder="Restaurant name">
                            <input type="text" id="newRestaurantAddress" class="form-control mb-4" placeholder="Restaurant address">
                            <div class="d-flex text-center">
                            <button id="createRestaurantBtn" class="btn btn-md btn-rounded peach-gradient" type="button">Create new Restaurant</button>
                            <button id="cancelRestaurantBtn" class="btn btn-md btn-rounded btn-outline-white " type="button">Cancel</button>
                            </div>
                            </form>`
        form.scrollIntoView();
        document.getElementById("createRestaurantBtn").onclick = function () {
            const newRestaurantName = document.getElementById("newRestaurantName").value;
            const newRestaurantAddress = document.getElementById("newRestaurantAddress").value;

            const restaurant = new Restaurant(newRestaurantName, newRestaurantAddress, null, lat, lng);
            app.nearbyRestaurants.push(restaurant);
            form.innerHTML = "";
            app.displayNearbyRestaurants();
            app.infoWindow.close();
        }

        document.getElementById("cancelRestaurantBtn").onclick = function () {
            const marker = app.markers.pop()
            marker.setMap(null)
            app.displayNearbyRestaurants();
            app.infoWindow.close();
        }
    },

    // Creates new Restaurant page
    createRestaurantPage: function (restaurant) {
        // get container, change class for CSS grid, clear innerHTML
        const container = document.getElementById('container');
        container.className = 'container2';
        container.innerHTML = "";


        const card = document.createElement('div');
        const cardImg = document.createElement('div');
        const cardBody = document.createElement('div');
        // create streetView div, assign id and classname 
        const streetViewDiv = document.createElement('div');
        streetViewDiv.id = "streetView";
        streetViewDiv.className = 'streetView z-depth-2';

        // create mapDiv div, assign id and classname 
        const mapDiv = document.createElement('div');
        mapDiv.id = "mapDiv";
        mapDiv.className = 'mapDiv z-depth-2';

        // create aboutDiv div, assign id and classname 
        const viewRestaurantReviews = document.createElement('div');
        viewRestaurantReviews.id = "viewRestaurantReviews";
        viewRestaurantReviews.className = 'viewRestaurantReviews';

        // create aboutDiv div, assign id and classname 
        const leaveReviewsDiv = document.createElement('div');
        leaveReviewsDiv.id = "leaveReview";
        leaveReviewsDiv.className = 'leaveReview z-depth-2';

        // append divs
        container.appendChild(streetViewDiv);
        container.appendChild(mapDiv);
        container.appendChild(viewRestaurantReviews);
        container.appendChild(leaveReviewsDiv);

        // create steetView object 
        var panorama = new google.maps.StreetViewPanorama(
            streetViewDiv, {
            position: new google.maps.LatLng(restaurant.lat, restaurant.long),
            pov: {
                heading: 34,
                pitch: 10
            }
        });
        this.map.setStreetView(panorama);

        // create new map, dont know how to use the sameone... map not loading!!
        let options = {
            zoom: 16,
            center: { lat: restaurant.lat, lng: restaurant.long },
        }
        const map = new google.maps.Map(mapDiv, options);

        var request = {
            placeId: restaurant.Id,
            fields: ['formatted_phone_number', 'photo', 'opening_hours', 'website', 'type', 'reviews', 'user_ratings_total', 'icon']
        };

        service = new google.maps.places.PlacesService(map);
        service.getDetails(request, callback);

        function callback(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                //create marker.
                console.log(place)
                const marker = new google.maps.Marker({
                    position: new google.maps.LatLng(restaurant.lat, restaurant.long),
                    map: map,
                    title: restaurant.restaurantName
                });

                let dropdownItem = '';

                for (let i = 0; i < place.opening_hours.weekday_text.length; i++) {
                    dropdownItem += `<a class="dropdown-item" href="#">${place.opening_hours.weekday_text[i]}</a><div class="dropdown-divider"></div>`;
                }

                const dropdown = `<a class="btn peach-gradient dropdown-toggle mr-4" type="button" data-toggle="dropdown" aria-haspopup="true"
                                aria-expanded="false"><i class="far fa-calendar-alt"></i></i> Opening hours: </a>
                                <div class="dropdown-menu">
                                ${dropdownItem}
                                </div>`;

                let carouselImg = '';
                for (let i = 0; i < place.photos.length; i++) {
                    const activeClass = i ? '' : 'active'
                    carouselImg += `<div class="card-img-top carousel-item ${activeClass} view text-center">
                                    <img class="carousel-restaurant d-inline-block img-fluid" src="${place.photos[i].getUrl({ maxWidth: 500, maxHeight: 500 })}" alt="First slide">
                                    </div>`
                }

                card.className = 'restaurantCards d-flex flex-column z-depth-2'
                cardImg.className = 'view view-cascade'
                cardBody.className = 'd-flex flex-column flex-fill card-body card-body-restaurants card-body-cascade blue-gradient'

                cardImg.innerHTML = `<div id="carouselExampleFade" class="carousel slide carousel-fade z-depth-2" data-ride="carousel">
                <ol class="carousel-indicators">
                <li data-target="#carousel-example-1z" data-slide-to="0" class="active"></li>
                <li data-target="#carousel-example-1z" data-slide-to="1"></li>
                <li data-target="#carousel-example-1z" data-slide-to="2"></li>
                </ol>
                <div class="carousel-inner restaurant-carousel-inner">
                    ${carouselImg}
                </div>
                <a class="carousel-control-prev" href="#carouselExampleFade" role="button" data-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="sr-only">Previous</span>
                </a>
                <a class="carousel-control-next" href="#carouselExampleFade" role="button" data-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="sr-only">Next</span>
                </a>
                </div>`
                cardBody.innerHTML = `<div class="aboutCard blue-gradient">
                <h2 class="h2-responsive text-white">${restaurant.restaurantName}</h2><h4 class="orange-text">${app.displayAvgRating(restaurant.rating)}</h4>
                <ul class="list-group list-group-flush">
                <li class="list-group-item text-white"><i class="fas fa-map-marker-alt"></i> ${restaurant.address}</li>
                <li class="list-group-item text-white"><i class="fas fa-phone"></i> ${place.formatted_phone_number}</li>
                </ul>
                <div class="d-flex">
                <button onclick="window.location.href = '${place.website}';" class="btn peach-gradient" type="button">Go to Website</button> ${dropdown}
                </div>
                </div>`;

                card.appendChild(cardImg);
                card.appendChild(cardBody);
                container.appendChild(card)

                for (let i = 0; i < place.reviews.length; i++) {
                    //restaurant.leaveRating(place.reviews[i].rating, place.reviews[i].text, place.reviews[i].author_name)
                    restaurant.leaveRating(place.reviews[i].rating, place.reviews[i].text, place.reviews[i].author_name)
                }
                app.displayRestaurantReviews(restaurant, place.reviews, 'viewRestaurantReviews')
            } else {
                alert(status);
            }
        }
        this.leaveReviewForm(restaurant)

    },

    // Google searbox recomendations based on map bounds. Has an error displaying markers.
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
    constructor(name, address, id, lat, long, rating = 1, photoUrl = "https://mdbootstrap.com/img/Photos/Lightbox/Thumbnail/img%20(147).jpg") {
        this.restaurantName = name;
        this.address = address;
        this.Id = id;
        this.lat = lat;
        this.long = long;
        this.ratings = [];
        this.rating = rating;
        this.photoUrl = photoUrl
    }

    leaveRating(stars, comment, authorName) {
        const rating = new Rating(stars, comment, authorName)
        this.ratings.push(rating)

        for (let i = 0; i < this.ratings.length; i++) {
            this.ratings[i].key = i;
        }
    }
}

class Rating {
    constructor(stars, comment, authorName) {
        this.key;
        this.stars = stars;
        this.comment = comment;
        this.authorName = authorName;
    }
}

// Solution I found on StackOverflow to solve getMyLocation() error. 
window.addEventListener('load', function () {
    /*
    app.createRestaurantCards(app.restaurants[2], `nearbyCard1`)
    app.createRestaurantCards(app.restaurants[3], `nearbyCard2`)

    
    app.getMyLocation();
    const request = {
        location: new google.maps.LatLng(48.8737815, 2.3442197),
        radius: '500',
        type: ['restaurant']
    };
    app.service = new google.maps.places.PlacesService(app.map);
    app.service.nearbySearch(request, app.serviceCallback());
    */

})

