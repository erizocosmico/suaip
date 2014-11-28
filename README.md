# suaip

Suaip is a lightweight library for implementing your own swipeable cards. It's built on top of the awesome libraries [javascript-swipe-cards](https://github.com/apeatling/javascript-swipe-cards) and [Hammer.js](https://github.com/hammerjs/hammer.js).

Suaip was born because javascript-swipe-cards did not provide the functionality I needed for an app.
Those functionalities were:
* Only swipe down and up if the user scrolls to the and of the card (they were not scrollable)
* Left and right swipes

Suaip is composed by five cards:
* before card: the card that always is above the active card.
* active card: the card that is visible on the screen and the only one that can be swiped until another takes its place.
* after card: the card that is always below the active card.
* right card: the card that is always to the right of the active card.
* left card: the cad that is always to the left of the active card.

## Suaip swipes flow
As said above, the only swipeable card is the active card.
* When the active card is swiped to the left the current active card will become the left card. The right card will become the active card and the left card will become the right card.
* When the active card is swiped to the right the current active card will become the right card. The left card will become the active card and the right card will become the left card.
* When the active card is swiped up the the active card will become the before card. The before card will become the after card and the after card will become the active card.
* When the active card is swiped down the active card will become the after card. The after card will become the before card and the before card will become the active card.