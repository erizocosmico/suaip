/**
 * Suaip
 * Library for adding swipe cards to your app
 * Copyright (c) 2014 José Miguel Molina <hi@mvader.me>
 * Licensed under the MIT license
 *
 * Based on: JavaScript Swipe Cards (https://github.com/apeatling/javascript-swipe-cards)
 */

var Suaip = (function (Hammer, window) {
    'use strict';

    /**
     * @constant The speed cards will animate to completion with a fast drag
     * @type {number}
     */
    var ANIMATION_SPEED_FAST = 200;

    /**
     * @constant The speed cards will animate to completion with a slow drag
     * @type {number}
     */
    var ANIMATION_SPEED_SLOW = 100;

    /**
     * @constant The boundary to determine a fast or slow drag 0 (slow) to 3+ (very fast)
     * @type {number}
     */
    var DRAG_VELOCITY_BOUNDARY = 2;

    /**
     * Hold the hammer.js object
     * @type {object}
     */
    var h = {};

    /**
     * The before, active, and after card DOM elements
     * @type {object}
     */
    var cardElements = {};

    /**
     * The current drag direction from user input
     * @type {string}
     */
    var direction = false;

    /**
     * Easy shortener for handling adding and removing body classes.
     */
    var bodyClass = document.body.classList;

    /**
     * Accumulated distance
     * @type {Number}
     */
    var distanceDelta = 0;

    /**
     * Initialize swipe and cards
     */
    var init = function (options) {
        if (!(options && options.before && options.after && options.active)) {
            throw "Invalid config";
        }

        options.before.classList.add('before');
        options.active.classList.add('active');
        options.after.classList.add('after');

        if (options.left) {
            options.left.classList.add('left');
        }

        if (options.right) {
            options.right.classList.add('right');
        }

        _setCardElements(options.before, options.active, options.after,
            options.left, options.right);
        _bindTouchEvents();
    };

    /**
     * Initialize the hammer.js class, and bind drag events.
     */
    var _bindTouchEvents = function () {
        h = new Hammer(cardElements.active, {
            preventDefault: true
        });

        h.on('dragup', _dragUp);
        h.on('dragdown', _dragDown);
        h.on('dragend', _dragEnd);
        if (cardElements.left) h.on('dragleft', _dragLeft);
        if (cardElements.right) h.on('dragright', _dragRight);

        // While drag events are active, make sure touch events are accessible.
        for (var card in cardElements) {
            cardElements[card].removeEventListener('touchstart', _disableTouch );
        }
    };

    /**
     * Unbind hammer.js drag events.
     */
    var _unbindTouchEvents = function () {
        h.off('dragup', _dragUp);
        h.off('dragdown', _dragDown);
        h.off('dragend', _dragEnd);
        if (cardElements.left) h.off('dragleft', _dragLeft);
        if (cardElements.right) h.off('dragright', _dragRight);

        // While drag events are not active, block all touch events to stop scrolling.
        for (var card in cardElements) {
            cardElements[card].addEventListener('touchstart', _disableTouch, false );
        }
    };

    /**
     * Select the card elements from the DOM and store them in cardElements for easy access or set
     * the given elements.
     * @param {HTMLElement|undefined} before Before card
     * @param {HTMLElement|undefined} active Active card
     * @param {HTMLElement|undefined} after After card
     * @param {HTMLElement|undefined} left Left card
     * @paran {HTMLElement|undefined} right Right card
     */
    var _setCardElements = function (before, active, after, left, right) {
        cardElements.before = before ? before :document.getElementsByClassName('before')[0];
        cardElements.active = active ? active : document.getElementsByClassName('active')[0];
        cardElements.after = after ? after : document.getElementsByClassName('after')[0];
        cardElements.left = left ? left : document.getElementsByClassName('left')[0];
        cardElements.right = right ? right : document.getElementsByClassName('right')[0];
    };

    /**
     * On the dragup event, transform the active and after card elements to move
     * with the drag.
     * @param {Event} e Drag event
     */
    var _dragUp = function (e) {
        var distancePercent = Math.round(((-(distanceDelta - e.gesture.distance)) / cardElements.active.scrollHeight) * 100);
        var opacity = (distancePercent < 30) ? 30 : distancePercent;

        translateElement(cardElements.active, 0, distanceDelta - e.gesture.distance, 0);
        translateElement(cardElements.after, 0, cardElements.active.scrollHeight - (-(distanceDelta - e.gesture.distance)), 0);
        cardElements.after.style.opacity = '.' + opacity;
    };

    var _dragLeft = function (e) {
        translateElement(cardElements.active, -e.gesture.distance, distanceDelta, 0);
        var distancePercent = Math.round((e.gesture.distance / cardElements.active.scrollWidth) * 100);
        var opacity = (distancePercent < 30) ? 30 : distancePercent;

        translateElement(cardElements.right, cardElements.active.scrollWidth - e.gesture.distance, 0, 0);
        cardElements.right.style.opacity = '.' + opacity;
    };

    var _dragRight = function (e) {
        translateElement(cardElements.active, e.gesture.distance, distanceDelta, 0);
        var distancePercent = Math.round((e.gesture.distance / cardElements.active.scrollWidth) * 100);
        var opacity = (distancePercent < 30) ? 30 : distancePercent;

        translateElement(cardElements.left, -(cardElements.active.scrollWidth - e.gesture.distance), 0, 0);
        cardElements.left.style.opacity = '.' + opacity;
    };

    /**
     * On the dragdown event, transform the active and before card elements
     * to move with the drag.
     * @param {Event} e Drag event
     */
    var _dragDown = function (e) {
        var distancePercent = Math.round(((distanceDelta + e.gesture.distance) / cardElements.active.scrollHeight) * 100);
        var opacity = ( distancePercent < 30 ) ? 30 : distancePercent;

        translateElement(cardElements.active, 0, distanceDelta + e.gesture.distance, 0);
        translateElement(cardElements.before, 0, -(cardElements.active.scrollHeight - (e.gesture.distance + distanceDelta)), 0);
        cardElements.before.style.opacity = '.' + opacity;
    };

    /**
     * On the dragend event, determine if the drag animation should slide
     * the next card in, or restore the active card.
     * @param {Event} e Drag event
     */
    var _dragEnd = function (e) {
        direction = e.gesture.direction;

        // Disable hammer and any touch events until animation is complete.
        _unbindTouchEvents();

        var animationSpeed = (e.gesture.velocityY > DRAG_VELOCITY_BOUNDARY)
            ? ANIMATION_SPEED_SLOW
            : ANIMATION_SPEED_FAST;
        _addAnimations(animationSpeed);

        // Finish the transition after swipe.
        if ('up' === direction) {
            _completeUpTransition(e);
        } else if ('down' === direction) {
            _completeDownTransition(e);
        } else if ('left' === direction) {
            _completeLeftTransition(e);
        } else if ('right' === direction) {
            _completeRightTransition(e);
        }
    };

    /**
     * Change the active card class if the transition was a success.
     */
    var _shiftActiveCard = function (e) {
        cardElements.active.classList.remove('animate');

        ['animate', 'dragup-reset', 'drag-complete', 'dragup-complete',
        'dragdown-reset', 'dragdown-complete', 'dragleft-complete',
        'dragright-complete'].forEach(function (c) {
            bodyClass.remove(c);
        });

        for (var card in cardElements) {
            cardElements[card].style.transition = '';
            cardElements[card].style.transform = cardElements[card].style.webkitTransform = '';
            cardElements[card].style.opacity = '';
        }

        cardElements.active.removeEventListener('transitionend', _shiftActiveCard, false);

        // If the transition to a new card was successful then shift cards
        if (cardElements.active.classList.contains('drag-complete')) {
            _setCardClasses();
        }

        // Reselect card elements and their new classes.
        _setCardElements();
        _bindTouchEvents();
    };

    /**
     * Set the classes on each card, depending on the completed drag direction.
     */
    var _setCardClasses = function () {
        var beforeCardClass = cardElements.before.classList;
        var activeCardClass = cardElements.active.classList;
        var afterCardClass = cardElements.after.classList;
        var leftCardClass = cardElements.left.classList;
        var rightCardClass = cardElements.right.classList;

        activeCardClass.remove('active');
        activeCardClass.remove('drag-complete');

        if ('up' === direction) {
            beforeCardClass.remove('before');
            beforeCardClass.add('after');

            activeCardClass.add('before');

            afterCardClass.remove('after');
            afterCardClass.add('active');
        } else if ('down' === direction) {
            beforeCardClass.remove('before');
            beforeCardClass.add('active');

            activeCardClass.add('after');

            afterCardClass.remove('after');
            afterCardClass.add('before');
        } else if ('left' === direction) {
            rightCardClass.remove('right');
            rightCardClass.add('active');

            activeCardClass.add('left');

            leftCardClass.remove('left');
            leftCardClass.add('right');
        } else {
            leftCardClass.remove('left');
            leftCardClass.add('active');

            activeCardClass.add('right');

            rightCardClass.remove('right');
            rightCardClass.add('left');
        }
    };

    /**
     * Add animations to the card elements
     * @param {Number} animationSpeed Animation speed
     */
    var _addAnimations = function (animationSpeed) {
        cardElements.active.classList.add('animate');
        for (var card in cardElements) {
            cardElements[card].style.transition = 'all ' + animationSpeed + 'ms ease';
        }
    };

    /**
     * Removes all animations from the cards after 400ms,
     * waiting for the animation to end.
     */
    var _removeAnimations = function () {
        window.setTimeout(function () {
            cardElements.active.classList.remove('animate');

            for (var card in cardElements) {
                cardElements[card].style.transition = '';
            }
        }, 400);
    };

    /**
     * Translates an element to another 3d position
     * @param  {HTMLElement} elem Element to translate
     * @param  {Number}      x    X axis position
     * @param  {Number}      y    Y axis position
     * @param  {Number}      z    Z axis position
     */
    var translateElement = function (elem, x, y, z) {
        var translation = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)';
        elem.style.transform = elem.style.webkitTransform = translation;
    };

    /**
     * Manage the movemenet of the card when the up gesture has ended
     * @param {Event} e Gesture event
     */
    var _completeUpTransition = function (e) {
        // Increment distance delta (negative)
        distanceDelta -= e.gesture.distance;

        // If the new distance delta is less than the height of the card minus a 2/3 of its height
        // means that the card should not be discarded yet
        if (-distanceDelta < (cardElements.active.scrollHeight - (window.innerHeight / 6 * 4))) {
            // If the distance is greater than the card's size but it's not great enough to
            // discard the card it must leave no distance between the card's end and the next card
            if ((-distanceDelta + window.innerHeight) > cardElements.active.scrollHeight) {
                distanceDelta = -(cardElements.active.scrollHeight - window.innerHeight);
                translateElement(cardElements.active, 0, -(cardElements.active.scrollHeight - window.innerHeight), 0);
            }

            // Bind touch events again and remove the animations.
            // Not removing the animations will cause a lot of lag when scrolling.
            _bindTouchEvents();
            _removeAnimations();
        } else {
            // Discard card and show the next one
            distanceDelta = 0;
            bodyClass.add('dragup-complete');
            cardElements.active.classList.add('drag-complete');
            cardElements.active.addEventListener('transitionend', _shiftActiveCard, false);
        }
    };

    /**
     * Manage the movemenet of the card when the down gesture has ended
     * @param {Event} e Gesture event
     */
    var _completeDownTransition = function(e) {
        // Increment distance delta
        distanceDelta += e.gesture.distance;

        // If the distance of the top of the card is less than 1/3 of its size
        // the card will not be discarded
        if (distanceDelta < (window.innerHeight / 6 * 2)) {
            // If distance delta is greater than zero we have to translate the position
            // of the card to the top
            if (distanceDelta > 0) {
                distanceDelta = 0;
                translateElement(cardElements.active, 0, 0, 0);
            }

            // Bind touch events again and remove the animations.
            // Not removing the animations will cause a lot of lag when scrolling.
            _bindTouchEvents();
            _removeAnimations();
        } else {
            // Discard card and show the next one
            distanceDelta = 0;
            bodyClass.add('dragdown-complete');
            cardElements.active.classList.add('drag-complete');
            cardElements.active.addEventListener('transitionend', _shiftActiveCard, false);
        }
    };

    /**
     * Manage the movemenet of the card when the left gesture has ended
     * @param {Event} e Gesture event
     */
    var _completeLeftTransition = function (e) {
        if (e.gesture.distance < window.innerWidth / 3) {
            translateElement(cardElements.active, 0, distanceDelta, 0);

            // Bind touch events again and remove the animations.
            // Not removing the animations will cause a lot of lag when scrolling.
            _bindTouchEvents();
            _removeAnimations();
        } else {
            bodyClass.add('dragleft-complete');
            cardElements.active.classList.add('drag-complete');
            cardElements.active.addEventListener('transitionend', _shiftActiveCard, false);
        }
    };

    /**
     * Manage the movemenet of the card when the right gesture has ended
     * @param {Event} e Gesture event
     */
    var _completeRightTransition = function (e) {
        if (e.gesture.distance < window.innerWidth / 3) {
            translateElement(cardElements.active, 0, distanceDelta, 0);

            // Bind touch events again and remove the animations.
            // Not removing the animations will cause a lot of lag when scrolling.
            _bindTouchEvents();
            _removeAnimations();
        } else {
            bodyClass.add('dragright-complete');
            cardElements.active.classList.add('drag-complete');
            cardElements.active.addEventListener('transitionend', _shiftActiveCard, false);
        }
    };

    /**
     * Prevent default actions for an event
     * @param {Event} e Drag event
     */
    var _disableTouch = function (e) {
        e.preventDefault();
    };

    return {
        init: init
    };

})(Hammer, window);