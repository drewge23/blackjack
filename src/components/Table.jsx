import React, {useEffect, useState} from 'react';
import Side from "./Side";
import {throttle} from "lodash";
import s from './table.module.css'

const BASE_URL = 'https://www.deckofcardsapi.com/api/deck/'

function Table(props) {
    // TODO: make a player vs dealer counter --done
    // TODO: make a component from the duplicated markup --done
    // TODO: make cards smaller --done
    // TODO: make the hit func throttle --done
    // TODO: make a Lobby
    // TODO: add a player name

    const [playerCards, setPlayerCards] = useState([])
    const [dealerCards, setDealerCards] = useState([])
    const [playerPoints, setPlayerPoints] = useState(0)
    const [dealerPoints, setDealerPoints] = useState(0)
    const [playerWins, setPlayerWins] = useState(0)
    const [dealerWins, setDealerWins] = useState(0)
    const [result, setResult] = useState('')

    const [deckId, setDeckId] = useState(null)
    const [remaining, setRemaining] = useState(52)

    const [playerTurnIsOver, setPlayerTurnIsOver] = useState(false)
    const [dealerTurnIsOver, setDealerTurnIsOver] = useState(false)

    const [isRestarting, setIsRestarting] = useState(false)
    const [isReshuffling, setIsReshuffling] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const initialFetch = (deckId) => {
        setIsLoading(true)
        fetch(BASE_URL + deckId + '/draw/?count=2')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setDeckId(data.deck_id)
                    setPlayerCards(data.cards)
                    setRemaining(data.remaining)
                    setIsRestarting(false)
                    setIsLoading(false)
                }
            })
    }
    useEffect(() => {
        if (playerCards.length === 0) {
            initialFetch('new')
        }
    }, [])

    useEffect(() => {
        if (isRestarting) return
        setPlayerPoints(pointsCount(playerCards))
    }, [playerCards])
    useEffect(() => {
        if (isRestarting || playerTurnIsOver) return
        checkResult(playerPoints)
    }, [playerPoints])
    useEffect(() => {
        if (!playerTurnIsOver) return
        if (checkResult(playerPoints) === 'busted') setResult('Busted!')
        if (checkResult(playerPoints) === 'blackjack') setResult('Blackjack!')
        dealerTurn()
    }, [playerTurnIsOver])
    useEffect(() => {
        if (isRestarting || dealerTurnIsOver) return
        setDealerPoints(pointsCount(dealerCards))
    }, [dealerCards])
    useEffect(() => {
        if (isRestarting || dealerTurnIsOver) return
        checkResult(dealerPoints)
            ? setDealerTurnIsOver(true)
            : dealerTurn()
    }, [dealerPoints])
    useEffect(() => {
        if (isRestarting || !dealerTurnIsOver) return
        evaluation()
    }, [dealerTurnIsOver])

    const pointsCount = (cardArr) => {
        let sum = 0
        let aceCounter = 0
        for (let i = 0; i < cardArr.length; i++) {
            switch (cardArr[i].value) {
                case 'JACK':
                case 'QUEEN':
                case 'KING':
                    sum += 10
                    break
                case 'ACE':
                    aceCounter++
                    break
                default:
                    sum += Number(cardArr[i].value)
            }
        }
        for (let i = 0; i < aceCounter; i++) {
            let aceDownCounter = aceCounter
            sum += sum + aceDownCounter * 11 > 21 ? 1 : 11
            aceDownCounter--
        }
        return sum
    }
    const checkResult = (points) => {
        if (points > 21) {
            setPlayerTurnIsOver(true)
            return 'busted'
        }
        if (points === 21) {
            setPlayerTurnIsOver(true)
            return 'blackjack'
        }
        if (points >= 17) {
            return 'stop'
        }
        return null
    }

    const hit = throttle(() => {
        if (playerTurnIsOver) return
        fetch(BASE_URL + deckId + '/draw/?count=1')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setPlayerCards(playerCards.concat(data.cards))
                    setRemaining(data.remaining)
                }
            })
    }, 1000)
    const stand = () => {
        if (playerTurnIsOver) return
        setPlayerTurnIsOver(true)
    }
    const restart = () => {
        setIsRestarting(true)
        setPlayerCards([])
        setDealerCards([])
        setPlayerPoints(0)
        setDealerPoints(0)
        setPlayerTurnIsOver(false)
        setDealerTurnIsOver(false)
        setResult('')

        if (remaining < 10) {
            setIsReshuffling(true)
            fetch(BASE_URL + deckId + '/shuffle/')
                .then(() => {
                    initialFetch(deckId)
                    setIsReshuffling(false)
                })
        } else {
            initialFetch(deckId)
        }
    }
    const dealerTurn = () => {
        if (deckId) {
            setTimeout(() => {
                fetch(BASE_URL + deckId + '/draw/?count=1')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            setDealerCards(dealerCards.concat(data.cards))
                            setRemaining(data.remaining)
                        }
                    })
            }, 1000)
        }
    }
    const evaluation = () => {
        if ((checkResult(playerPoints) === checkResult(dealerPoints)
                && checkResult(playerPoints) !== 'stop')
            || playerPoints === dealerPoints) {
            setResult("It's a draw!")
        } else if (checkResult(dealerPoints) === 'busted') {
            setResult('You won!')
            setPlayerWins(playerWins + 1)
        } else if (checkResult(playerPoints) === 'busted') {
            setResult('You lost!')
            setDealerWins(dealerWins + 1)
        } else {
            setResult(playerPoints > dealerPoints ? 'You won!' : 'You lost!')
            playerPoints > dealerPoints
                ? setPlayerWins(playerWins + 1)
                : setDealerWins(dealerWins + 1)
        }
    }

    return (
        <div className={s.container}>
            {isReshuffling
                ? <div>Reshuffling...</div>
                : isLoading
                    ? <div>Loading...</div>
                    : <>
                        <div className={s.leftSide}>
                            <p>{remaining} cards left</p>
                            <button onClick={restart} className={s.button}>RESTART</button>
                        </div>
                        <div className={s.cards}>
                            <h2>{result}</h2>
                            <Side name={'Dealer'} cards={dealerCards}/>
                            <Side name={'Player'} cards={playerCards}/>
                            <div className={s.buttons}>
                                <button onClick={hit} className={s.button}>HIT</button>
                                <button onClick={stand} className={s.button}>STAND</button>
                            </div>
                        </div>
                        <div className={s.results}>
                            <div>
                                <p>Dealer: {dealerPoints} points</p>
                                <p>{dealerWins} wins</p>
                            </div>
                            <div>
                                <p>Player: {playerPoints} points</p>
                                <p>{playerWins} wins</p>
                            </div>
                        </div>
                    </>}
        </div>

    )
}

export default Table;