import React from 'react';
import { GREEK_META } from '../../constants/greekMeta';

interface BSEquationProps {
  optionType: 'call' | 'put';
}

const dc = GREEK_META.delta.color;
const tc = GREEK_META.theta.color;
const vc = GREEK_META.vega.color;
const rc = GREEK_META.rho.color;
const neu = '#94A3B8';

function Col({ c, children }: { c: string; children: React.ReactNode }) {
  return <span style={{ color: c }}>{children}</span>;
}

function Sup({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: '7px', verticalAlign: 'super', lineHeight: 0 }}>
      {children}
    </span>
  );
}

function Frac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        verticalAlign: 'middle',
        margin: '0 2px',
      }}
    >
      <span
        style={{
          borderBottom: '1px solid #475569',
          paddingBottom: '1px',
          whiteSpace: 'nowrap',
          lineHeight: 1.5,
        }}
      >
        {num}
      </span>
      <span style={{ paddingTop: '1px', whiteSpace: 'nowrap', lineHeight: 1.5 }}>
        {den}
      </span>
    </span>
  );
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const BSEquation: React.FC<BSEquationProps> = ({ optionType }) => {
  const isCall = optionType === 'call';

  const discountFactor = (
    <>
      <span style={{ color: neu }}>e</span>
      <Sup>
        <span style={{ color: neu }}>−</span>
        <Col c={rc}>r</Col>
        <Col c={tc}>T</Col>
      </Sup>
    </>
  );

  return (
    <div
      className="bg-slate-800 rounded-lg px-3 py-2.5"
      style={{ fontSize: '10px', fontFamily: MONO }}
    >
      <div className="text-[9px] uppercase tracking-widest text-slate-500 font-sans mb-2">
        Black–Scholes
      </div>

      {/* Price formula */}
      <div
        style={{
          color: neu,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '7px',
        }}
      >
        {isCall ? (
          <>
            <span>C = </span>
            <Col c={dc}>S·N(d₁)</Col>
            <span> − K·</span>
            {discountFactor}
            <span>·N(d₂)</span>
          </>
        ) : (
          <>
            <span>P = K·</span>
            {discountFactor}
            <span>·N(−d₂) − </span>
            <Col c={dc}>S·N(−d₁)</Col>
          </>
        )}
      </div>

      {/* d₁ */}
      <div
        style={{
          color: neu,
          display: 'flex',
          alignItems: 'center',
          marginBottom: '7px',
        }}
      >
        <span>d₁ = </span>
        <Frac
          num={
            <>
              <span style={{ color: neu }}>ln(S/K) + (</span>
              <Col c={rc}>r</Col>
              <span style={{ color: neu }}> + </span>
              <Col c={vc}>σ</Col>
              <Sup>
                <Col c={vc}>²</Col>
              </Sup>
              <span style={{ color: neu }}>/2)·</span>
              <Col c={tc}>T</Col>
            </>
          }
          den={
            <>
              <Col c={vc}>σ</Col>
              <span style={{ color: neu }}>·√</span>
              <Col c={tc}>T</Col>
            </>
          }
        />
      </div>

      {/* d₂ */}
      <div style={{ color: neu, display: 'flex', alignItems: 'center' }}>
        <span>d₂ = d₁ − </span>
        <Col c={vc}>σ</Col>
        <span>·√</span>
        <Col c={tc}>T</Col>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2.5 pt-2 border-t border-slate-700">
        {[
          { label: 'Delta', color: dc },
          { label: 'Theta', color: tc },
          { label: 'Vega', color: vc },
          { label: 'Rho', color: rc },
        ].map(({ label, color }) => (
          <span key={label} className="text-[9px] font-sans flex items-center gap-1">
            <span style={{ color }}>{label === 'Vega' ? 'ν' : label === 'Theta' ? 'Θ' : label === 'Rho' ? 'ρ' : 'Δ'}</span>
            <span className="text-slate-500">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
