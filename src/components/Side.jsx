import React from 'react';

function Side({name, cards}) {
    return (
        <div className="side">
            <div className="cards">
                {cards.map((card) => (
                    <img src={card.image} alt={card.code} key={card.code}
                         style={{width: '120px'}}
                    />
                ))}
            </div>
        </div>
    );
}

export default Side;